#!/usr/bin/env python3
"""
Direct database check for any existing analysis data
"""

import sqlite3
import json
from pathlib import Path

# Find the database file
db_paths = [
    "Backend/saadhyam.db",
    "saadhyam.db",
    "Backend/database.db",
    "database.db"
]

db_path = None
for path in db_paths:
    if Path(path).exists():
        db_path = path
        break

if not db_path:
    print("❌ Database file not found. Checked paths:")
    for path in db_paths:
        print(f"   - {path}")
    exit(1)

print(f"✅ Found database: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("\n🔍 Checking database tables...")
    
    # List all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print(f"📋 Found {len(tables)} tables:")
    for table in tables:
        print(f"   - {table[0]}")
    
    # Check BusinessAnalysis table
    print(f"\n🔍 Checking business_analysis table...")
    try:
        cursor.execute("SELECT COUNT(*) FROM business_analysis WHERE user_id = 24;")
        count = cursor.fetchone()[0]
        print(f"📊 Found {count} analysis records for user_id=24")
        
        if count > 0:
            # Get the latest records
            cursor.execute("""
                SELECT id, analysis_status, business_name, business_type, 
                       last_analyzed_at, strengths_data, competitor_analysis
                FROM business_analysis 
                WHERE user_id = 24 
                ORDER BY last_analyzed_at DESC 
                LIMIT 3;
            """)
            
            records = cursor.fetchall()
            print(f"\n📋 Latest {len(records)} analysis records:")
            
            for i, record in enumerate(records, 1):
                print(f"\n   Record {i}:")
                print(f"     ID: {record[0]}")
                print(f"     Status: {record[1]}")
                print(f"     Business: {record[2]} ({record[3]})")
                print(f"     Date: {record[4]}")
                print(f"     Has Strengths: {'Yes' if record[5] else 'No'}")
                print(f"     Has Competitors: {'Yes' if record[6] else 'No'}")
                
                # If there's data, show a preview
                if record[5]:  # strengths_data
                    try:
                        strengths = json.loads(record[5])
                        print(f"     Strengths Preview: {strengths[:2] if isinstance(strengths, list) else 'Invalid format'}")
                    except:
                        print(f"     Strengths Preview: [Parse Error]")
        
    except Exception as e:
        print(f"❌ Error checking business_analysis table: {e}")
    
    # Check if there are any other analysis-related tables
    analysis_tables = [table[0] for table in tables if 'analysis' in table[0].lower() or 'business' in table[0].lower()]
    
    if analysis_tables:
        print(f"\n🔍 Found analysis-related tables:")
        for table in analysis_tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table} WHERE user_id = 24;")
                count = cursor.fetchone()[0]
                print(f"   - {table}: {count} records")
            except:
                print(f"   - {table}: [Error checking]")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Database error: {e}")

print("\n" + "=" * 60)
print("🏁 DATABASE CHECK COMPLETE")
print("=" * 60)