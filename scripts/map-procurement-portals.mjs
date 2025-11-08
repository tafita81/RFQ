#!/usr/bin/env node
/**
 * Portal Mapper - Maps procurement/RFQ portals for each company
 * Identifies where companies publish their RFQs/tenders
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

// Portal keywords to search for
const PORTAL_KEYWORDS = {
  vendor: ['vendor portal', 'supplier portal', 'vendorportal', 'supplierportal', 'become a vendor', 'become a supplier'],
  rfq: ['rfq', 'rfp', 'request for quote', 'request for proposal', 'tender', 'bid', 'solicitation', 'procurement opportunities'],
  registration: ['vendor registration', 'supplier registration', 'register as vendor', 'register as supplier'],
  thirdParty: ['ariba', 'coupa', 'jaggaer', 'bonfire', 'procore', 'oracle', 'sap', 'workday']
};

// Find portal-related pages
function findPortalPages(html, baseUrl) {
  const portals = {
    vendor: [],
    rfq: [],
    registration: [],
    thirdParty: []
  };
  
  if (!html) return portals;
  
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].toLowerCase();
    const fullHref = href.toLowerCase();
    
    // Check each category
    for (const [category, keywords] of Object.entries(PORTAL_KEYWORDS)) {
      if (keywords.some(kw => fullHref.includes(kw) || text.includes(kw))) {
        try {
          const url = new URL(href, baseUrl);
          portals[category].push({
            url: url.href,
            text: match[2].trim()
          });
        } catch {
          // Invalid URL
        }
      }
    }
  }
  
  // Remove duplicates
  for (const category in portals) {
    const seen = new Set();
    portals[category] = portals[category].filter(p => {
      if (seen.has(p.url)) return false;
      seen.add(p.url);
      return true;
    });
  }
  
  return portals;
}

// Analyze portal accessibility
function analyzePortalType(html, url) {
  if (!html) return 'unknown';
  
  const lowerHtml = html.toLowerCase();
  const lowerUrl = url.toLowerCase();
  
  // Check for third-party portals
  const thirdPartyIndicators = ['ariba', 'coupa', 'jaggaer', 'bonfire', 'procore'];
  if (thirdPartyIndicators.some(tp => lowerUrl.includes(tp) || lowerHtml.includes(tp))) {
    return 'third-party';
  }
  
  // Check for login requirements
  const loginIndicators = ['login', 'sign in', 'username', 'password', 'authentication required', 'access denied'];
  if (loginIndicators.some(li => lowerHtml.includes(li))) {
    return 'login-required';
  }
  
  // Check for registration
  const regIndicators = ['register', 'sign up', 'create account', 'registration'];
  if (regIndicators.some(ri => lowerHtml.includes(ri))) {
    return 'registration-required';
  }
  
  return 'public';
}

// Extract portal name from page
function extractPortalName(html, url) {
  if (!html) return null;
  
  // Try to find portal name in title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    return titleMatch[1].trim().substring(0, 200);
  }
  
  // Try h1
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) {
    return h1Match[1].trim().substring(0, 200);
  }
  
  return null;
}

// Map procurement portal for a single company
async function mapCompanyPortal(company) {
  console.log(`\n[${company.companyId}] ${company.companyName}`);
  console.log(`  URL: ${company.url}`);
  
  const result = {
    procurementPortalUrl: null,
    portalType: null,
    portalName: null,
    registrationUrl: null,
    portalNotes: null
  };
  
  try {
    // 1. Fetch main page
    const response = await fetchWithTimeout(company.url);
    if (!response.ok) {
      console.log(`  ✗ HTTP ${response.status}`);
      return result;
    }
    
    const mainHtml = await response.text();
    
    // 2. Find portal pages
    const portals = findPortalPages(mainHtml, company.url);
    
    console.log(`  Found portals:`);
    console.log(`    Vendor portals: ${portals.vendor.length}`);
    console.log(`    RFQ pages: ${portals.rfq.length}`);
    console.log(`    Registration: ${portals.registration.length}`);
    console.log(`    Third-party: ${portals.thirdParty.length}`);
    
    // 3. Prioritize portal selection
    let selectedPortal = null;
    
    // Priority 1: Third-party portals (usually most reliable)
    if (portals.thirdParty.length > 0) {
      selectedPortal = portals.thirdParty[0];
      result.portalType = 'third-party';
    }
    // Priority 2: RFQ/tender pages
    else if (portals.rfq.length > 0) {
      selectedPortal = portals.rfq[0];
    }
    // Priority 3: Vendor portals
    else if (portals.vendor.length > 0) {
      selectedPortal = portals.vendor[0];
    }
    
    if (selectedPortal) {
      result.procurementPortalUrl = selectedPortal.url;
      console.log(`  ✓ Selected portal: ${selectedPortal.url}`);
      
      // 4. Analyze portal page
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
        const portalResponse = await fetchWithTimeout(selectedPortal.url, 10000);
        
        if (portalResponse.ok) {
          const portalHtml = await portalResponse.text();
          
          if (!result.portalType) {
            result.portalType = analyzePortalType(portalHtml, selectedPortal.url);
          }
          
          result.portalName = extractPortalName(portalHtml, selectedPortal.url) || selectedPortal.text;
          
          console.log(`    Type: ${result.portalType}`);
          console.log(`    Name: ${result.portalName}`);
        }
      } catch (error) {
        console.log(`    ⚠ Could not analyze portal page: ${error.message}`);
      }
    } else {
      console.log(`  ⚠ No procurement portal found`);
    }
    
    // 5. Set registration URL if found
    if (portals.registration.length > 0) {
      result.registrationUrl = portals.registration[0].url;
      console.log(`  ✓ Registration: ${result.registrationUrl}`);
    }
    
    // 6. Create notes
    const notes = [];
    if (portals.vendor.length > 1) notes.push(`${portals.vendor.length} vendor portals found`);
    if (portals.rfq.length > 1) notes.push(`${portals.rfq.length} RFQ pages found`);
    if (portals.thirdParty.length > 0) notes.push(`Uses: ${portals.thirdParty.map(p => new URL(p.url).hostname).join(', ')}`);
    
    result.portalNotes = notes.length > 0 ? notes.join('. ') : null;
    
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
  }
  
  return result;
}

// Main function
async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Get all companies
    const [companies] = await connection.execute(
      `SELECT * FROM leads 
       WHERE statusCode = '200'
       ORDER BY 
         CASE 
           WHEN hasRfqSystem = 1 THEN 1
           WHEN hasVendorPortal = 1 THEN 2
           ELSE 3
         END,
         companyId
       LIMIT 100`
    );
    
    console.log(`\n🔍 Mapping procurement portals for ${companies.length} companies\n`);
    console.log(`Focus areas: PFAS/EPR, BuyAmerica, EUDR\n`);
    console.log(`${'='.repeat(80)}\n`);
    
    let mapped = 0;
    let withPortals = 0;
    
    // Process companies one by one
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      console.log(`\n[${i + 1}/${companies.length}]`);
      
      const portalInfo = await mapCompanyPortal(company);
      
      // Update database
      try {
        await connection.execute(
          `UPDATE leads 
           SET procurementPortalUrl = ?,
               portalType = ?,
               portalName = ?,
               registrationUrl = ?,
               portalNotes = ?,
               lastChecked = NOW()
           WHERE companyId = ?`,
          [
            portalInfo.procurementPortalUrl,
            portalInfo.portalType,
            portalInfo.portalName,
            portalInfo.registrationUrl,
            portalInfo.portalNotes,
            company.companyId
          ]
        );
        
        mapped++;
        if (portalInfo.procurementPortalUrl) {
          withPortals++;
        }
      } catch (error) {
        console.error(`  ✗ Database error: ${error.message}`);
      }
      
      // Rate limiting
      if (i < companies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`\n${'='.repeat(80)}\n`);
    console.log(`✅ Portal mapping completed!`);
    console.log(`📊 Companies processed: ${mapped}`);
    console.log(`🔗 Companies with portals: ${withPortals}`);
    console.log(`📈 Success rate: ${((withPortals / mapped) * 100).toFixed(1)}%`);
    
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
