#!/usr/bin/env node
/**
 * Advanced Web Scraper for Buyer Opportunities (RFQs, Tenders, Bids)
 * Extracts procurement opportunities from company websites
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import 'dotenv/config';

// Simple LLM invocation using fetch
async function invokeLLM(params) {
  const response = await fetch(process.env.BUILT_IN_FORGE_API_URL + '/llm/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`
    },
    body: JSON.stringify(params)
  });
  return response.json();
}

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

// Find RFQ/procurement pages
function findOpportunityPages(html, baseUrl) {
  const pages = [];
  const keywords = [
    'rfq', 'rfp', 'tender', 'bid', 'procurement', 'purchasing',
    'supplier', 'vendor', 'solicitation', 'opportunity', 'opportunities',
    'licitação', 'licitacao', 'cotação', 'cotacao', 'compras'
  ];
  
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1].toLowerCase();
    const text = match[2].toLowerCase();
    
    if (keywords.some(kw => href.includes(kw) || text.includes(kw))) {
      try {
        const url = new URL(match[1], baseUrl);
        pages.push(url.href);
      } catch {
        // Invalid URL
      }
    }
  }
  
  return [...new Set(pages)];
}

// Use LLM to extract structured opportunity data
async function extractOpportunitiesWithLLM(html, sourceUrl, companyName) {
  try {
    const prompt = `Analyze this webpage content and extract ALL procurement opportunities, RFQs, tenders, or bids.
For each opportunity found, extract:
- title (required)
- description (summary of what they're buying)
- opportunityType (RFQ, RFP, Tender, Bid, or similar)
- category (what industry/product category)
- value (estimated contract value if mentioned)
- deadline (submission deadline if mentioned, in ISO format)
- publishedDate (when posted, in ISO format - estimate from "posted X days ago" or similar)
- contactEmail
- contactPhone
- location
- requirements (key requirements or qualifications)

Return ONLY a JSON array of opportunities. If no opportunities found, return empty array [].
Only include opportunities from the last 30 days.

Webpage content (first 8000 chars):
${html.substring(0, 8000)}`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert at extracting procurement opportunities from webpages. Return only valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "opportunities",
          strict: true,
          schema: {
            type: "object",
            properties: {
              opportunities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: ["string", "null"] },
                    opportunityType: { type: ["string", "null"] },
                    category: { type: ["string", "null"] },
                    value: { type: ["string", "null"] },
                    deadline: { type: ["string", "null"] },
                    publishedDate: { type: "string" },
                    contactEmail: { type: ["string", "null"] },
                    contactPhone: { type: ["string", "null"] },
                    location: { type: ["string", "null"] },
                    requirements: { type: ["string", "null"] }
                  },
                  required: ["title", "publishedDate"],
                  additionalProperties: false
                }
              }
            },
            required: ["opportunities"],
            additionalProperties: false
          }
        }
      }
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Add company info and source URL to each opportunity
    return result.opportunities.map(opp => ({
      ...opp,
      companyName,
      sourceUrl,
      status: 'active'
    }));
    
  } catch (error) {
    console.error(`LLM extraction error: ${error.message}`);
    return [];
  }
}

// Scrape opportunities from a company
async function scrapeCompanyOpportunities(company) {
  console.log(`\nScraping ${company.companyName} (${company.url})`);
  
  const opportunities = [];
  
  try {
    // Fetch main page
    const response = await fetchWithTimeout(company.url);
    if (!response.ok) {
      console.log(`  ✗ HTTP ${response.status}`);
      return opportunities;
    }
    
    const html = await response.text();
    
    // Find procurement/RFQ pages
    const oppPages = findOpportunityPages(html, company.url);
    console.log(`  Found ${oppPages.length} potential opportunity pages`);
    
    if (oppPages.length === 0) {
      console.log(`  ℹ No procurement pages found`);
      return opportunities;
    }
    
    // Scrape each opportunity page (limit to first 3)
    for (const pageUrl of oppPages.slice(0, 3)) {
      try {
        console.log(`  Analyzing: ${pageUrl}`);
        const pageResponse = await fetchWithTimeout(pageUrl);
        
        if (pageResponse.ok) {
          const pageHtml = await pageResponse.text();
          const extracted = await extractOpportunitiesWithLLM(
            pageHtml,
            pageUrl,
            company.companyName
          );
          
          opportunities.push(...extracted);
          console.log(`    ✓ Found ${extracted.length} opportunities`);
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.log(`    ✗ Error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
  }
  
  return opportunities;
}

// Main function
async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Get companies with RFQ systems or vendor portals
    const [companies] = await connection.execute(
      `SELECT * FROM leads 
       WHERE (hasRfqSystem = 1 OR hasVendorPortal = 1)
       AND statusCode = '200'
       ORDER BY id 
       LIMIT 10`
    );
    
    console.log(`Found ${companies.length} companies with procurement systems\n`);
    
    if (companies.length === 0) {
      console.log('No suitable companies found. Run scrape-leads.mjs first.');
      return;
    }
    
    let totalOpportunities = 0;
    
    // Process companies one by one (to respect rate limits)
    for (const company of companies) {
      const opportunities = await scrapeCompanyOpportunities(company);
      
      // Save opportunities to database
      for (const opp of opportunities) {
        try {
          await connection.execute(
            `INSERT INTO opportunities 
             (companyId, companyName, sourceUrl, title, description, opportunityType, 
              category, value, deadline, publishedDate, contactEmail, contactPhone, 
              location, requirements, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              company.companyId,
              opp.companyName,
              opp.sourceUrl,
              opp.title,
              opp.description,
              opp.opportunityType,
              opp.category,
              opp.value,
              opp.deadline,
              opp.publishedDate,
              opp.contactEmail,
              opp.contactPhone,
              opp.location,
              opp.requirements,
              opp.status
            ]
          );
          totalOpportunities++;
        } catch (error) {
          console.error(`  ✗ Database error: ${error.message}`);
        }
      }
      
      // Wait between companies
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log(`\n✅ Scraping completed!`);
    console.log(`📊 Total opportunities found: ${totalOpportunities}`);
    
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
