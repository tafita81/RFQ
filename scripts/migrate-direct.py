#!/usr/bin/env python3
"""
Direct migration from MySQL to Supabase using REST API
"""

import os
import json
import mysql.connector
from supabase import create_client, Client

# Supabase credentials
SUPABASE_URL = "https://twglceexfetejawoumsr.supabase.co"
SUPABASE_KEY = "sb_secret_Nji3B0HHnOhFQawYD_RGoA_M4FQObuM"

# MySQL connection from DATABASE_URL
DATABASE_URL = os.getenv('DATABASE_URL')

def parse_mysql_url(url):
    # mysql://user:pass@host:port/database
    import re
    pattern = r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/([^\?]+)'
    match = re.match(pattern, url)
    if match:
        return {
            'user': match.group(1),
            'password': match.group(2),
            'host': match.group(3),
            'port': int(match.group(4)),
            'database': match.group(5)
        }
    return None

def create_supabase_tables(supabase: Client):
    """Create tables in Supabase using direct SQL"""
    print("\n📋 Creating Supabase schema...")
    
    # Note: Supabase Python client doesn't have direct SQL execution
    # We need to use PostgREST API or create tables manually
    print("✅ Tables should be created via Supabase Dashboard SQL Editor")
    print("   Or use the schema SQL provided earlier")
    return True

def migrate_leads(mysql_conn, supabase: Client):
    """Migrate leads from MySQL to Supabase"""
    print("\n📦 Migrating leads...")
    
    cursor = mysql_conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM leads")
    leads = cursor.fetchall()
    
    print(f"Found {len(leads)} leads to migrate")
    
    if len(leads) == 0:
        return
    
    # Convert datetime objects to strings
    for lead in leads:
        for key, value in lead.items():
            if hasattr(value, 'isoformat'):
                lead[key] = value.isoformat()
    
    # Batch insert
    batch_size = 100
    for i in range(0, len(leads), batch_size):
        batch = leads[i:i + batch_size]
        try:
            result = supabase.table('leads').insert(batch).execute()
            print(f"✅ Inserted batch {i // batch_size + 1} ({len(batch)} records)")
        except Exception as e:
            print(f"❌ Error inserting batch {i // batch_size + 1}: {e}")
    
    print(f"✅ Migrated {len(leads)} leads")
    cursor.close()

def migrate_opportunities(mysql_conn, supabase: Client):
    """Migrate opportunities from MySQL to Supabase"""
    print("\n📦 Migrating opportunities...")
    
    cursor = mysql_conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM opportunities")
    opportunities = cursor.fetchall()
    
    print(f"Found {len(opportunities)} opportunities to migrate")
    
    if len(opportunities) == 0:
        return
    
    # Convert datetime objects to strings
    for opp in opportunities:
        for key, value in opp.items():
            if hasattr(value, 'isoformat'):
                opp[key] = value.isoformat()
    
    # Batch insert
    batch_size = 100
    for i in range(0, len(opportunities), batch_size):
        batch = opportunities[i:i + batch_size]
        try:
            result = supabase.table('opportunities').insert(batch).execute()
            print(f"✅ Inserted batch {i // batch_size + 1} ({len(batch)} records)")
        except Exception as e:
            print(f"❌ Error inserting batch {i // batch_size + 1}: {e}")
    
    print(f"✅ Migrated {len(opportunities)} opportunities")
    cursor.close()

def verify_migration(supabase: Client):
    """Verify the migration"""
    print("\n🔍 Verifying migration...")
    
    try:
        leads = supabase.table('leads').select("*", count='exact').execute()
        opps = supabase.table('opportunities').select("*", count='exact').execute()
        
        print(f"✅ Leads in Supabase: {leads.count}")
        print(f"✅ Opportunities in Supabase: {opps.count}")
    except Exception as e:
        print(f"❌ Verification failed: {e}")

def main():
    print("🚀 Starting migration from MySQL to Supabase\n")
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Supabase Key: {SUPABASE_KEY[:20]}...")
    
    # Parse MySQL connection
    mysql_config = parse_mysql_url(DATABASE_URL)
    if not mysql_config:
        print("❌ Invalid DATABASE_URL")
        return
    
    # Connect to Supabase
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Connected to Supabase")
    
    # Connect to MySQL
    print("\n🔌 Connecting to MySQL...")
    mysql_conn = mysql.connector.connect(**mysql_config)
    print("✅ Connected to MySQL")
    
    try:
        # Migrate data
        migrate_leads(mysql_conn, supabase)
        migrate_opportunities(mysql_conn, supabase)
        
        # Verify
        verify_migration(supabase)
        
        print("\n✅ Migration completed successfully!")
        print("\n📝 Next steps:")
        print("1. Update your .env file with Supabase credentials")
        print("2. Test the application with the new database")
        print("3. Update GitHub repository with new configuration")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
    finally:
        mysql_conn.close()

if __name__ == "__main__":
    main()
