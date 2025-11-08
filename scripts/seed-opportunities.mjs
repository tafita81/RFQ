#!/usr/bin/env node
/**
 * Seed sample opportunities for demonstration
 */

import mysql from 'mysql2/promise';

const sampleOpportunities = [
  {
    companyId: 1,
    companyName: "Walmart",
    sourceUrl: "https://www.walmart.com/suppliers/rfq/12345",
    title: "RFQ for Sustainable Packaging Materials - Q1 2025",
    description: "Walmart is seeking suppliers for sustainable packaging materials including biodegradable plastics and recycled cardboard for our retail operations across North America.",
    opportunityType: "RFQ",
    category: "Packaging & Materials",
    value: "$2.5M - $5M",
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    publishedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    contactEmail: "procurement@walmart.com",
    location: "Bentonville, AR, USA",
    requirements: "ISO 14001 certification, minimum 5 years experience, capacity for 10M units/year",
    status: "active"
  },
  {
    companyId: 3,
    companyName: "Amazon",
    sourceUrl: "https://www.amazon.com/procurement/tender/67890",
    title: "Tender for Last-Mile Delivery Packaging Solutions",
    description: "Amazon seeks innovative packaging solutions for last-mile delivery that reduce waste and improve customer experience. Focus on right-sized packaging and recyclable materials.",
    opportunityType: "Tender",
    category: "Logistics & Packaging",
    value: "$10M+",
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    publishedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    contactEmail: "vendor-ops@amazon.com",
    contactPhone: "+1-206-555-0100",
    location: "Seattle, WA, USA",
    requirements: "PFAS-free materials, Buy America compliance, sustainability reporting",
    status: "active"
  },
  {
    companyId: 6,
    companyName: "McDonald's",
    sourceUrl: "https://www.mcdonalds.com/suppliers/rfp/2025-packaging",
    title: "RFP: Global Food Packaging Redesign Initiative",
    description: "McDonald's is launching a global initiative to redesign all food packaging with focus on sustainability, recyclability, and customer convenience. Multi-year contract opportunity.",
    opportunityType: "RFP",
    category: "Food Service Packaging",
    value: "$50M+ (multi-year)",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    publishedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    contactEmail: "global.procurement@mcdonalds.com",
    location: "Chicago, IL, USA (Global)",
    requirements: "Global manufacturing capability, PFAS/EPR compliance, proven sustainability track record",
    status: "active"
  },
  {
    companyId: 8,
    companyName: "Nestle",
    sourceUrl: "https://www.nestle.com/procurement/opportunities/packaging-2025",
    title: "Flexible Packaging for Confectionery Products - EMEA Region",
    description: "Nestle seeks suppliers for flexible packaging solutions for confectionery products across EMEA markets. Focus on recyclable materials and reduced plastic content.",
    opportunityType: "RFQ",
    category: "Flexible Packaging",
    value: "€3M - €7M",
    deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), // 18 days from now
    publishedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    contactEmail: "emea.procurement@nestle.com",
    location: "Vevey, Switzerland",
    requirements: "EUDR compliance, recyclable materials, multi-country distribution capability",
    status: "active"
  },
  {
    companyId: 13,
    companyName: "IKEA",
    sourceUrl: "https://www.ikea.com/suppliers/tender/furniture-packaging-2025",
    title: "Tender for Furniture Packaging Solutions - Global Supply Chain",
    description: "IKEA is seeking innovative packaging solutions for flat-pack furniture that minimize material use while ensuring product protection during global shipping.",
    opportunityType: "Tender",
    category: "Industrial Packaging",
    value: "$15M - $25M",
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
    publishedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    contactEmail: "packaging.procurement@ikea.com",
    location: "Älmhult, Sweden (Global)",
    requirements: "FSC certification, design optimization capability, global logistics experience",
    status: "active"
  },
  {
    companyId: 2,
    companyName: "Target",
    sourceUrl: "https://www.target.com/vendors/rfq/private-label-packaging",
    title: "Private Label Product Packaging - Beauty & Personal Care",
    description: "Target seeks packaging suppliers for expanding private label beauty and personal care line. Focus on premium aesthetics with sustainable materials.",
    opportunityType: "RFQ",
    category: "Consumer Packaging",
    value: "$5M - $8M",
    deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
    publishedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    contactEmail: "sourcing@target.com",
    location: "Minneapolis, MN, USA",
    requirements: "FDA compliance, recyclable materials, design services capability",
    status: "active"
  },
  {
    companyId: 40,
    companyName: "SAM.gov",
    sourceUrl: "https://www.sam.gov/opp/12345-packaging-supplies",
    title: "Federal Government Packaging Supplies - GSA Contract",
    description: "GSA Schedule opportunity for packaging supplies and materials for federal agencies. Multi-year contract with option years.",
    opportunityType: "Bid",
    category: "Government Procurement",
    value: "$20M (5 years)",
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    publishedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    contactEmail: "contracting@gsa.gov",
    location: "Washington, DC, USA",
    requirements: "Buy America Act compliance, veteran-owned business preference, GSA registration required",
    status: "active"
  },
  {
    companyId: 7,
    companyName: "Starbucks",
    sourceUrl: "https://www.starbucks.com/suppliers/rfp/cup-innovation-2025",
    title: "Sustainable Cup Innovation Program - Global Rollout",
    description: "Starbucks seeks partners for next-generation sustainable cup solutions including compostable hot cups and recyclable cold cups for global deployment.",
    opportunityType: "RFP",
    category: "Food Service Packaging",
    value: "$30M+ (multi-year)",
    deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
    publishedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    contactEmail: "global.sourcing@starbucks.com",
    location: "Seattle, WA, USA (Global)",
    requirements: "Compostable certification, global manufacturing, proven sustainability innovation",
    status: "active"
  }
];

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Inserting sample opportunities...\n');
    
    for (const opp of sampleOpportunities) {
      await connection.execute(
        `INSERT INTO opportunities 
         (companyId, companyName, sourceUrl, title, description, opportunityType, 
          category, value, deadline, publishedDate, contactEmail, contactPhone, 
          location, requirements, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          opp.companyId,
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
          opp.contactPhone || null,
          opp.location,
          opp.requirements,
          opp.status
        ]
      );
      console.log(`✓ ${opp.companyName}: ${opp.title}`);
    }
    
    console.log(`\n✅ Successfully inserted ${sampleOpportunities.length} sample opportunities!`);
    
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
