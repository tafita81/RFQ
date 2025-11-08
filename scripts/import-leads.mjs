#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read CSV file
const csvPath = path.join(__dirname, '../../leads-scraper/companies.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());

// Parse CSV
const headers = lines[0].split(',');
const companies = lines.slice(1).map(line => {
  const values = line.split(',');
  return {
    id: parseInt(values[0]),
    name: values[1],
    url: values[2],
    country: values[3],
    focus: values[4]
  };
});

console.log(`Found ${companies.length} companies to import`);

// Connect to database
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Import data
let imported = 0;
for (const company of companies) {
  try {
    await connection.execute(
      `INSERT INTO leads (companyId, companyName, url, country, focus, statusCode, lastChecked) 
       VALUES (?, ?, ?, ?, ?, 'pending', NOW())
       ON DUPLICATE KEY UPDATE 
       companyName = VALUES(companyName),
       url = VALUES(url),
       country = VALUES(country),
       focus = VALUES(focus)`,
      [company.id, company.name, company.url, company.country, company.focus]
    );
    imported++;
    if (imported % 100 === 0) {
      console.log(`Imported ${imported}/${companies.length} companies...`);
    }
  } catch (error) {
    console.error(`Error importing ${company.name}:`, error.message);
  }
}

console.log(`\n✅ Successfully imported ${imported} companies!`);
await connection.end();
