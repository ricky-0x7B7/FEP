#!/usr/bin/env python3
"""
Export demo data script for KuttiApp
Creates a complete backup of database and uploads for demo purposes
"""

import sqlite3
import json
import os
import shutil
from datetime import datetime

def export_demo_data():
    """Export current database content and uploads as demo data"""
    
    print("🔄 Exporting demo data...")
    
    # Create demo_data directory
    demo_dir = "demo_data"
    if os.path.exists(demo_dir):
        shutil.rmtree(demo_dir)
    os.makedirs(demo_dir)
    
    # Connect to database
    conn = sqlite3.connect('kuttiapp.db')
    conn.row_factory = sqlite3.Row  # This enables column access by name
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [table[0] for table in cursor.fetchall()]
    
    demo_data = {}
    
    # Export each table
    for table in tables:
        print(f"  📋 Exporting table: {table}")
        cursor.execute(f"SELECT * FROM {table}")
        rows = cursor.fetchall()
        
        # Convert rows to dictionaries
        demo_data[table] = []
        for row in rows:
            demo_data[table].append(dict(row))
    
    # Save database data as JSON
    with open(os.path.join(demo_dir, 'database_demo.json'), 'w', encoding='utf-8') as f:
        json.dump(demo_data, f, indent=2, ensure_ascii=False, default=str)
    
    conn.close()
    
    # Copy uploads directory
    uploads_src = "uploads"
    uploads_dest = os.path.join(demo_dir, "uploads")
    
    if os.path.exists(uploads_src):
        print(f"  📁 Copying uploads directory...")
        shutil.copytree(uploads_src, uploads_dest)
        
        # Count files
        file_count = len([f for f in os.listdir(uploads_dest) if os.path.isfile(os.path.join(uploads_dest, f))])
        print(f"    ✅ Copied {file_count} media files")
    else:
        print("  ⚠️  No uploads directory found")
    
    # Create metadata with specific export date
    from datetime import datetime
    export_date = datetime(2025, 9, 5, 21, 43, 0)
    metadata = {
        "export_date": export_date.isoformat(),
        "database_tables": len(tables),
        "total_records": sum(len(demo_data[table]) for table in tables),
        "description": "KuttiApp demo data with sample users, missions, children, news and media files"
    }
    
    with open(os.path.join(demo_dir, 'metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"\n✅ Demo data exported successfully!")
    print(f"   📊 {metadata['database_tables']} tables, {metadata['total_records']} total records")
    print(f"   📁 Data saved in: {demo_dir}/")
    print(f"   🕒 Export time: {metadata['export_date']}")

if __name__ == "__main__":
    export_demo_data()