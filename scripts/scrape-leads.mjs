#!/usr/bin/env node
/**
 * Web Scraper for collecting leads from companies
 * Collects: emails, contacts, vendor portals, RFQs
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { eq } from 'drizzle-orm';

// Simple HTTP fetch with timeout
async function fetchWithTimeout(url, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Extract emails from text
function extractEmails(text) {
  if (!text) return [];
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailRegex) || [];
  // Filter out common example emails
  return [...new Set(emails.filter(e => 
    !e.includes('example') && 
    !e.includes('domain') && 
    !e.includes('test') &&
    !e.includes('@sentry')
  ))].slice(0, 5);
}

// Extract phone numbers from text
function extractPhones(text) {
  if (!text) return [];
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = text.match(phoneRegex) || [];
  return [...new Set(phones)].slice(0, 3);
}

// Find links with keywords
function findLinks(html, baseUrl, keywords) {
  const links = [];
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1].toLowerCase();
    const text = match[2].toLowerCase();
    
    if (keywords.some(kw => href.includes(kw) || text.includes(kw))) {
      try {
        const url = new URL(match[1], baseUrl);
        links.push(url.href);
      } catch {
        // Invalid URL, skip
      }
    }
  }
  
  return [...new Set(links)].slice(0, 3);
}

// Scrape a single company
async function scrapeCompany(company) {
  console.log(`Scraping ${company.companyName} (${company.url})`);
  
  const result = {
    companyId: company.companyId,
    statusCode: null,
    emails: [],
    phones: [],
    contactPages: [],
    vendorPages: [],
    rfqPages: [],
    hasVendorPortal: 0,
    hasRfqSystem: 0,
    notes: ''
  };
  
  try {
    // Fetch main page
    const response = await fetchWithTimeout(company.url);
    result.statusCode = response.status.toString();
    
    if (!response.ok) {
      result.notes = `HTTP ${response.status}`;
      return result;
    }
    
    const html = await response.text();
    
    // Extract emails and phones from main page
    result.emails = extractEmails(html);
    result.phones = extractPhones(html);
    
    // Find contact pages
    const contactKeywords = ['contact', 'contato', 'about', 'sobre'];
    result.contactPages = findLinks(html, company.url, contactKeywords);
    
    // Find vendor/procurement pages
    const vendorKeywords = ['vendor', 'supplier', 'procurement', 'purchasing', 'fornecedor'];
    result.vendorPages = findLinks(html, company.url, vendorKeywords);
    result.hasVendorPortal = result.vendorPages.length > 0 ? 1 : 0;
    
    // Find RFQ/tender pages
    const rfqKeywords = ['rfq', 'rfp', 'tender', 'bid', 'licitação', 'cotação'];
    result.rfqPages = findLinks(html, company.url, rfqKeywords);
    result.hasRfqSystem = result.rfqPages.length > 0 ? 1 : 0;
    
    // Try to fetch contact pages for more emails
    for (const contactUrl of result.contactPages.slice(0, 2)) {
      try {
        const contactResponse = await fetchWithTimeout(contactUrl);
        if (contactResponse.ok) {
          const contactHtml = await contactResponse.text();
          result.emails.push(...extractEmails(contactHtml));
          result.phones.push(...extractPhones(contactHtml));
        }
      } catch {
        // Skip failed contact pages
      }
    }
    
    // Remove duplicates
    result.emails = [...new Set(result.emails)].slice(0, 10);
    result.phones = [...new Set(result.phones)].slice(0, 5);
    
    result.notes = `Found ${result.emails.length} emails, ${result.phones.length} phones`;
    
  } catch (error) {
    result.statusCode = 'error';
    result.notes = error.message.substring(0, 200);
  }
  
  return result;
}

// Main function
async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Get companies that need scraping (pending or old data)
    const [companies] = await connection.execute(
      `SELECT * FROM leads 
       WHERE statusCode = 'pending' OR statusCode IS NULL 
       ORDER BY id 
       LIMIT 50`
    );
    
    console.log(`Found ${companies.length} companies to scrape`);
    
    if (companies.length === 0) {
      console.log('No companies to scrape. All done!');
      return;
    }
    
    // Process in batches of 5
    const batchSize = 5;
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(companies.length/batchSize)}`);
      
      // Scrape batch in parallel
      const results = await Promise.all(batch.map(scrapeCompany));
      
      // Save results
      for (const result of results) {
        await connection.execute(
          `UPDATE leads SET 
           statusCode = ?,
           emails = ?,
           phones = ?,
           contactPages = ?,
           vendorPages = ?,
           rfqPages = ?,
           hasVendorPortal = ?,
           hasRfqSystem = ?,
           notes = ?,
           lastChecked = NOW()
           WHERE companyId = ?`,
          [
            result.statusCode,
            JSON.stringify(result.emails),
            JSON.stringify(result.phones),
            JSON.stringify(result.contactPages),
            JSON.stringify(result.vendorPages),
            JSON.stringify(result.rfqPages),
            result.hasVendorPortal,
            result.hasRfqSystem,
            result.notes,
            result.companyId
          ]
        );
      }
      
      // Wait a bit between batches to be respectful
      if (i + batchSize < companies.length) {
        console.log('Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n✅ Scraping completed!');
    
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
