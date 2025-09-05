#!/usr/bin/env python3
"""
Import demo data script for KuttiApp
Restores demo database and uploads from exported data
"""

import sqlite3
import json
import os
import shutil
from datetime import datetime

def import_demo_data():
    """Import demo data into database and restore uploads"""
    
    demo_dir = "demo_data"
    
    if not os.path.exists(demo_dir):
        print("❌ No demo_data directory found!")
        print("   Run export_demo_data.py first to create demo data")
        return False
    
    print("🔄 Importing demo data...")
    
    # Load metadata
    metadata_file = os.path.join(demo_dir, 'metadata.json')
    if os.path.exists(metadata_file):
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        print(f"  📋 Demo data from: {metadata['export_date']}")
        print(f"  📊 {metadata['database_tables']} tables, {metadata['total_records']} records")
    
    # Connect to database
    conn = sqlite3.connect('kuttiapp.db')
    cursor = conn.cursor()
    
    # Verify database schema exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    if not tables:
        print("❌ Database appears to be empty! Run reset_db.py first.")
        conn.close()
        return False
    
    print(f"  📊 Found {len(tables)} tables in database: {', '.join(tables)}")
    
    # Check and fix database schema to match demo data
    cursor.execute("PRAGMA table_info(users)")
    user_columns = [row[1] for row in cursor.fetchall()]
    missing_user_cols = []
    if 'full_name' not in user_columns:
        missing_user_cols.append('full_name TEXT')
    if 'bio' not in user_columns:
        missing_user_cols.append('bio TEXT')
    if 'ui_language' not in user_columns:
        missing_user_cols.append('ui_language TEXT DEFAULT "it"')
    
    for col_def in missing_user_cols:
        try:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_def}")
            print(f"  🔧 Added missing column {col_def.split()[0]} to users table")
        except sqlite3.Error as e:
            print(f"  ⚠️  Could not add column to users: {e}")
    
    cursor.execute("PRAGMA table_info(children)")
    child_columns = [row[1] for row in cursor.fetchall()]
    if 'sponsor_id' not in child_columns:
        try:
            cursor.execute("ALTER TABLE children ADD COLUMN sponsor_id INTEGER")
            print("  🔧 Added missing sponsor_id column to children table")
        except sqlite3.Error as e:
            print(f"  ⚠️  Could not add sponsor_id to children: {e}")
    
    # Load demo data
    demo_data_file = os.path.join(demo_dir, 'database_demo.json')
    with open(demo_data_file, 'r', encoding='utf-8') as f:
        demo_data = json.load(f)
    
    # Clear existing data and import demo data
    for table_name, records in demo_data.items():
        if table_name == 'sqlite_sequence':
            continue  # Skip sequence table
            
        print(f"  📋 Importing {len(records)} records into {table_name}")
        
        # Check if table exists before trying to delete from it
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cursor.fetchone():
            print(f"  ⚠️  Table {table_name} does not exist, skipping...")
            continue
        
        # Clear existing data
        cursor.execute(f"DELETE FROM {table_name}")
        
        if records:
            # Get column names from first record
            columns = list(records[0].keys())
            placeholders = ','.join(['?' for _ in columns])
            
            # Insert demo data
            insert_sql = f"INSERT INTO {table_name} ({','.join(columns)}) VALUES ({placeholders})"
            
            try:
                for record in records:
                    values = [record[col] for col in columns]
                    cursor.execute(insert_sql, values)
            except sqlite3.OperationalError as e:
                print(f"❌ Error inserting into {table_name}: {e}")
                print(f"   Columns in data: {columns}")
                cursor.execute(f"PRAGMA table_info({table_name})")
                db_columns = [row[1] for row in cursor.fetchall()]
                print(f"   Columns in database: {db_columns}")
                conn.rollback()
                conn.close()
                return False
    
    # Reset sequences
    if 'sqlite_sequence' in demo_data:
        cursor.execute("DELETE FROM sqlite_sequence")
        for seq_record in demo_data['sqlite_sequence']:
            cursor.execute("INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)", 
                         (seq_record['name'], seq_record['seq']))
    
    conn.commit()
    conn.close()
    
    # Restore uploads directory
    uploads_src = os.path.join(demo_dir, "uploads")
    uploads_dest = "uploads"
    
    if os.path.exists(uploads_src):
        print(f"  📁 Restoring uploads directory...")
        
        # Remove existing uploads
        if os.path.exists(uploads_dest):
            shutil.rmtree(uploads_dest)
        
        # Copy demo uploads
        shutil.copytree(uploads_src, uploads_dest)
        
        file_count = len([f for f in os.listdir(uploads_dest) if os.path.isfile(os.path.join(uploads_dest, f))])
        print(f"    ✅ Restored {file_count} media files")
    else:
        print("  ⚠️  No demo uploads found")
    
    print(f"\n✅ Demo data imported successfully!")
    print(f"   🚀 KuttiApp is ready with sample data!")
    return True

if __name__ == "__main__":
    import_demo_data()
