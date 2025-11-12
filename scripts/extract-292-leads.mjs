#!/usr/bin/env node
/**
 * Extract 292 real RFQ leads from uploaded files
 */

import fs from 'fs';
import path from 'path';

const uploadDir = '/home/ubuntu/upload';
const outputFile = '/home/ubuntu/leads-dashboard/data/rfq-leads-292.json';

// Read all Pasted_content files
const files = [
  'Pasted_content.txt',
  'Pasted_content_01.txt',
  'Pasted_content_02.txt',
  'Pasted_content_03.txt',
  'Pasted_content_04.txt',
  'Pasted_content_05.txt'
];

console.log('🔍 Extracting 292 RFQ leads from uploaded files...\n');

let allContent = '';
for (const file of files) {
  const filePath = path.join(uploadDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    allContent += content + '\n';
    console.log(`✅ Read ${file} (${(content.length / 1024).toFixed(1)} KB)`);
  }
}

// Extract CSV data (starts after line 5)
const lines = allContent.split('\n');
const leads = [];

// Find CSV header
let csvStartIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('#,Title,Source,Posted Date,Description')) {
    csvStartIndex = i + 1;
    break;
  }
}

if (csvStartIndex === -1) {
  console.error('❌ CSV header not found');
  process.exit(1);
}

console.log(`\n📊 Found CSV data starting at line ${csvStartIndex}`);

// Parse CSV lines
for (let i = csvStartIndex; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Stop at section breaks or empty lines
  if (!line || line.startsWith('...') || line.startsWith('Salve como') || line.startsWith('2. 292 EMAILS')) {
    break;
  }
  
  // Parse CSV line (handle commas inside quotes)
  const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
  
  if (parts && parts.length >= 9) {
    const lead = {
      id: parts[0].replace(/"/g, ''),
      title: parts[1].replace(/"/g, ''),
      source: parts[2].replace(/"/g, ''),
      postedDate: parts[3].replace(/"/g, ''),
      description: parts[4].replace(/"/g, ''),
      contactEmail: parts[5].replace(/"/g, ''),
      contactPhone: parts[6].replace(/"/g, ''),
      proofLink: parts[7].replace(/"/g, ''),
      category: parts[8].replace(/"/g, ''),
      brokerLeverage: parts[9] ? parts[9].replace(/"/g, '') : ''
    };
    
    leads.push(lead);
  }
}

console.log(`✅ Extracted ${leads.length} leads\n`);

// Show sample
if (leads.length > 0) {
  console.log('📋 Sample lead:');
  console.log(JSON.stringify(leads[0], null, 2));
}

// Create data directory if it doesn't exist
const dataDir = path.dirname(outputFile);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Save to JSON
fs.writeFileSync(outputFile, JSON.stringify(leads, null, 2));
console.log(`\n💾 Saved ${leads.length} leads to ${outputFile}`);

// Also create CSV for easy import
const csvOutput = path.join(dataDir, 'rfq-leads-292.csv');
const csvHeader = 'id,title,source,postedDate,description,contactEmail,contactPhone,proofLink,category,brokerLeverage\n';
const csvRows = leads.map(lead => 
  `${lead.id},"${lead.title}","${lead.source}","${lead.postedDate}","${lead.description}","${lead.contactEmail}","${lead.contactPhone}","${lead.proofLink}","${lead.category}","${lead.brokerLeverage}"`
).join('\n');

fs.writeFileSync(csvOutput, csvHeader + csvRows);
console.log(`💾 Saved CSV to ${csvOutput}`);

console.log('\n✅ Extraction completed!');
console.log(`\nCategories found:`);
const categories = [...new Set(leads.map(l => l.category))];
categories.forEach(cat => {
  const count = leads.filter(l => l.category === cat).length;
  console.log(`  - ${cat}: ${count} leads`);
});
