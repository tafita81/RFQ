#!/usr/bin/env node
/**
 * Real Contact Scraper - Extracts REAL emails and phones from RFQ/procurement pages
 * Focus: Get actual contact information of procurement officers/buyers
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

// Fetch with timeout
async function fetchWithTimeout(url, timeout = 15000) {
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

// Extract ALL emails from HTML (more aggressive)
function extractEmails(html) {
  if (!html) return [];
  
  // Multiple email patterns
  const patterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    /mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi,
  ];
  
  const emails = new Set();
  
  for (const pattern of patterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const email = match[1] || match[0];
      // Filter out obvious fake/example emails
      if (!email.includes('example') && 
          !email.includes('domain') && 
          !email.includes('test') &&
          !email.includes('your') &&
          !email.includes('sample') &&
          !email.includes('@sentry') &&
          !email.includes('noreply')) {
        emails.add(email.toLowerCase());
      }
    }
  }
  
  return Array.from(emails);
}

// Extract phone numbers (more patterns)
function extractPhones(html) {
  if (!html) return [];
  
  const patterns = [
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    /\+\d{1,3}\s?\d{1,14}/g,
    /tel:([+\d\s-()]+)/gi,
  ];
  
  const phones = new Set();
  
  for (const pattern of patterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const phone = (match[1] || match[0]).trim();
      if (phone.length >= 10) {
        phones.add(phone);
      }
    }
  }
  
  return Array.from(phones).slice(0, 5);
}

// Find procurement/RFQ/contact pages
function findRelevantPages(html, baseUrl) {
  const pages = new Set();
  
  const keywords = [
    // RFQ/Procurement keywords
    'rfq', 'rfp', 'tender', 'bid', 'procurement', 'purchasing', 'sourcing',
    'supplier', 'vendor', 'solicitation', 'opportunity', 'opportunities',
    'licitação', 'licitacao', 'cotação', 'cotacao', 'compras',
    // Contact keywords
    'contact', 'contato', 'about', 'sobre', 'team', 'equipe',
    'buyer', 'comprador', 'procurement-officer', 'supply-chain'
  ];
  
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1].toLowerCase();
    const text = match[2].toLowerCase();
    
    if (keywords.some(kw => href.includes(kw) || text.includes(kw))) {
      try {
        const url = new URL(match[1], baseUrl);
        // Only include same domain
        if (url.hostname === new URL(baseUrl).hostname || 
            url.hostname.endsWith(new URL(baseUrl).hostname)) {
          pages.add(url.href);
        }
      } catch {
        // Invalid URL
      }
    }
  }
  
  return Array.from(pages);
}

// Extract structured contact info from page
function extractContactInfo(html, url) {
  const emails = extractEmails(html);
  const phones = extractPhones(html);
  
  // Try to find procurement-specific emails
  const procurementEmails = emails.filter(e => 
    e.includes('procurement') || 
    e.includes('purchasing') || 
    e.includes('sourcing') ||
    e.includes('vendor') ||
    e.includes('supplier') ||
    e.includes('rfq') ||
    e.includes('compras') ||
    e.includes('licitacao')
  );
  
  // Prioritize procurement emails, then general emails
  const prioritizedEmails = [
    ...procurementEmails,
    ...emails.filter(e => !procurementEmails.includes(e))
  ];
  
  return {
    emails: prioritizedEmails,
    phones,
    url
  };
}

// Scrape a single company for real contacts
async function scrapeCompanyContacts(company) {
  console.log(`\nScraping ${company.companyName} (${company.url})`);
  
  const allEmails = new Set();
  const allPhones = new Set();
  const sources = [];
  
  try {
    // 1. Fetch main page
    const response = await fetchWithTimeout(company.url);
    if (!response.ok) {
      console.log(`  ✗ HTTP ${response.status}`);
      return { emails: [], phones: [], sources: [] };
    }
    
    const mainHtml = await response.text();
    
    // Extract from main page
    const mainContacts = extractContactInfo(mainHtml, company.url);
    mainContacts.emails.forEach(e => allEmails.add(e));
    mainContacts.phones.forEach(p => allPhones.add(p));
    if (mainContacts.emails.length > 0 || mainContacts.phones.length > 0) {
      sources.push(company.url);
    }
    
    console.log(`  Main page: ${mainContacts.emails.length} emails, ${mainContacts.phones.length} phones`);
    
    // 2. Find and scrape relevant pages
    const relevantPages = findRelevantPages(mainHtml, company.url);
    console.log(`  Found ${relevantPages.length} relevant pages to check`);
    
    // Scrape up to 5 most relevant pages
    for (const pageUrl of relevantPages.slice(0, 5)) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
        
        const pageResponse = await fetchWithTimeout(pageUrl, 10000);
        if (pageResponse.ok) {
          const pageHtml = await pageResponse.text();
          const pageContacts = extractContactInfo(pageHtml, pageUrl);
          
          const beforeCount = allEmails.size;
          pageContacts.emails.forEach(e => allEmails.add(e));
          pageContacts.phones.forEach(p => allPhones.add(p));
          
          if (allEmails.size > beforeCount || pageContacts.phones.length > 0) {
            sources.push(pageUrl);
            console.log(`    ✓ ${new URL(pageUrl).pathname}: +${allEmails.size - beforeCount} emails, +${pageContacts.phones.length} phones`);
          }
        }
      } catch (error) {
        // Skip failed pages
      }
    }
    
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
  }
  
  const result = {
    emails: Array.from(allEmails).slice(0, 20),
    phones: Array.from(allPhones).slice(0, 10),
    sources: sources.slice(0, 5)
  };
  
  console.log(`  TOTAL: ${result.emails.length} emails, ${result.phones.length} phones`);
  
  return result;
}

// Main function
async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Get companies that haven't been scraped yet or need updating
    const [companies] = await connection.execute(
      `SELECT * FROM leads 
       WHERE statusCode = '200'
       ORDER BY 
         CASE 
           WHEN hasRfqSystem = 1 THEN 1
           WHEN hasVendorPortal = 1 THEN 2
           ELSE 3
         END,
         id
       LIMIT 100`
    );
    
    console.log(`Found ${companies.length} companies to scrape for contacts\n`);
    
    let totalLeads = 0;
    let companiesWithContacts = 0;
    
    // Process companies one by one
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      console.log(`[${i + 1}/${companies.length}]`);
      
      const contacts = await scrapeCompanyContacts(company);
      
      // Only create leads if we found real contact information
      if (contacts.emails.length > 0) {
        // Create an opportunity/lead entry for this company
        try {
          await connection.execute(
            `INSERT INTO opportunities 
             (companyId, companyName, sourceUrl, title, description, 
              opportunityType, category, publishedDate, contactEmail, 
              contactPhone, location, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, 'active')`,
            [
              company.companyId,
              company.companyName,
              contacts.sources[0] || company.url,
              `Procurement Contact - ${company.companyName}`,
              `Contact information for procurement/purchasing department. Emails: ${contacts.emails.slice(0, 3).join(', ')}${contacts.emails.length > 3 ? '...' : ''}`,
              'Contact',
              company.focus || 'General',
              contacts.emails.join(', '),
              contacts.phones.join(', ') || null,
              company.country
            ]
          );
          totalLeads++;
          companiesWithContacts++;
        } catch (error) {
          console.error(`  ✗ Database error: ${error.message}`);
        }
      }
      
      // Rate limiting between companies
      if (i < companies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`\n✅ Scraping completed!`);
    console.log(`📊 Companies processed: ${companies.length}`);
    console.log(`📧 Companies with contacts: ${companiesWithContacts}`);
    console.log(`📋 Total leads created: ${totalLeads}`);
    
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
