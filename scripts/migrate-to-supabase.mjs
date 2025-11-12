#!/usr/bin/env node
/**
 * Migrate data from MySQL (Manus) to Supabase (PostgreSQL)
 */

import mysql from 'mysql2/promise';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Schema SQL for PostgreSQL
const SCHEMA_SQL = `
-- Drop existing tables
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role VARCHAR(20) DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "lastSignedIn" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Leads table
CREATE TABLE leads (
  "companyId" SERIAL PRIMARY KEY,
  "companyName" VARCHAR(255) NOT NULL,
  url VARCHAR(512),
  country VARCHAR(100),
  focus VARCHAR(100),
  "statusCode" VARCHAR(32),
  emails TEXT,
  phones TEXT,
  "contactPages" TEXT,
  "vendorPages" TEXT,
  "rfqPages" TEXT,
  "hasVendorPortal" INTEGER DEFAULT 0,
  "hasRfqSystem" INTEGER DEFAULT 0,
  "procurementPortalUrl" VARCHAR(512),
  "portalType" VARCHAR(64),
  "portalName" VARCHAR(255),
  "registrationUrl" VARCHAR(512),
  "portalNotes" TEXT,
  "lastChecked" TIMESTAMP DEFAULT NOW() NOT NULL,
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Opportunities table
CREATE TABLE opportunities (
  id SERIAL PRIMARY KEY,
  "companyId" INTEGER,
  "companyName" VARCHAR(255),
  "companyUrl" VARCHAR(512),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  "opportunityType" VARCHAR(100),
  "publishedDate" TIMESTAMP NOT NULL,
  deadline TIMESTAMP,
  value VARCHAR(100),
  currency VARCHAR(10),
  "contactName" VARCHAR(255),
  "contactEmail" VARCHAR(320),
  "contactPhone" VARCHAR(50),
  "sourceUrl" VARCHAR(512),
  category VARCHAR(100),
  location VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_leads_country ON leads(country);
CREATE INDEX idx_leads_focus ON leads(focus);
CREATE INDEX idx_leads_portal_type ON leads("portalType");
CREATE INDEX idx_opportunities_published ON opportunities("publishedDate");
CREATE INDEX idx_opportunities_deadline ON opportunities(deadline);
CREATE INDEX idx_opportunities_company ON opportunities("companyName");

-- Enable RLS (optional)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Public access policies (adjust as needed)
CREATE POLICY "Enable read access for all users" ON leads FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON opportunities FOR SELECT USING (true);
`;

async function createSchema() {
  console.log('\n📋 Creating Supabase schema...\n');
  
  const { data, error } = await supabase.rpc('exec_sql', { sql: SCHEMA_SQL });
  
  if (error) {
    // Try alternative method using REST API
    console.log('Trying alternative schema creation method...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({ sql: SCHEMA_SQL })
    });
    
    if (!response.ok) {
      console.error('❌ Schema creation failed. You may need to run the SQL manually in Supabase SQL Editor.');
      console.log('\n📝 SQL to run:\n');
      console.log(SCHEMA_SQL);
      return false;
    }
  }
  
  console.log('✅ Schema created successfully!');
  return true;
}

async function migrateLeads(mysqlConnection) {
  console.log('\n📦 Migrating leads...');
  
  const [leads] = await mysqlConnection.execute('SELECT * FROM leads');
  console.log(`Found ${leads.length} leads to migrate`);
  
  if (leads.length === 0) return;
  
  // Batch insert
  const batchSize = 100;
  for (let i = 0; i < leads.length; i += batchSize) {
    const batch = leads.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('leads')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
    } else {
      console.log(`✅ Inserted batch ${i / batchSize + 1} (${batch.length} records)`);
    }
  }
  
  console.log(`✅ Migrated ${leads.length} leads`);
}

async function migrateOpportunities(mysqlConnection) {
  console.log('\n📦 Migrating opportunities...');
  
  const [opportunities] = await mysqlConnection.execute('SELECT * FROM opportunities');
  console.log(`Found ${opportunities.length} opportunities to migrate`);
  
  if (opportunities.length === 0) return;
  
  const batchSize = 100;
  for (let i = 0; i < opportunities.length; i += batchSize) {
    const batch = opportunities.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('opportunities')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
    } else {
      console.log(`✅ Inserted batch ${i / batchSize + 1} (${batch.length} records)`);
    }
  }
  
  console.log(`✅ Migrated ${opportunities.length} opportunities`);
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  const { count: leadsCount, error: leadsError } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });
  
  const { count: oppsCount, error: oppsError } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true });
  
  if (leadsError || oppsError) {
    console.error('❌ Verification failed');
    return;
  }
  
  console.log(`✅ Leads in Supabase: ${leadsCount}`);
  console.log(`✅ Opportunities in Supabase: ${oppsCount}`);
}

async function main() {
  console.log('🚀 Starting migration from MySQL to Supabase\n');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Supabase Key: ${SUPABASE_KEY.substring(0, 20)}...`);
  
  try {
    // Step 1: Create schema
    const schemaCreated = await createSchema();
    
    if (!schemaCreated) {
      console.log('\n⚠️  Please create the schema manually in Supabase SQL Editor, then run this script again with --skip-schema flag');
      process.exit(1);
    }
    
    // Step 2: Connect to MySQL
    console.log('\n🔌 Connecting to MySQL...');
    const mysqlConnection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('✅ Connected to MySQL');
    
    // Step 3: Migrate data
    await migrateLeads(mysqlConnection);
    await migrateOpportunities(mysqlConnection);
    
    // Step 4: Verify
    await verifyMigration();
    
    await mysqlConnection.end();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your .env file with Supabase credentials');
    console.log('2. Test the application with the new database');
    console.log('3. Update GitHub repository with new configuration');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
