#!/usr/bin/env python3
"""
File cleanup utility for KuttiApp
Helps identify and clean orphaned media files
"""

import sqlite3
import os
from datetime import datetime

def cleanup_orphaned_files():
    """Find and optionally remove orphaned media files"""
    
    print("🧹 Scanning for orphaned media files...")
    
    # Connect to database
    conn = sqlite3.connect('kuttiapp.db')
    cursor = conn.cursor()
    
    # Get all media files referenced in database
    cursor.execute('''
        SELECT DISTINCT media_path FROM news_media
        UNION
        SELECT DISTINCT photo FROM children WHERE photo IS NOT NULL AND photo != ''
        UNION  
        SELECT DISTINCT photo FROM missions WHERE photo IS NOT NULL AND photo != ''
        UNION
        SELECT DISTINCT photo FROM users WHERE photo IS NOT NULL AND photo != ''
    ''')
    
    db_files = {row[0] for row in cursor.fetchall()}
    conn.close()
    
    # Get all files in uploads directory
    uploads_dir = 'uploads'
    if not os.path.exists(uploads_dir):
        print("❌ Uploads directory not found!")
        return
    
    disk_files = set(os.listdir(uploads_dir))
    
    # Find orphaned files (on disk but not in database)
    orphaned_files = disk_files - db_files
    
    print(f"📊 Scan Results:")
    print(f"   📁 Files on disk: {len(disk_files)}")
    print(f"   🗄️  Files in database: {len(db_files)}")
    print(f"   🗑️  Orphaned files: {len(orphaned_files)}")
    
    if orphaned_files:
        print(f"\n🗑️  Orphaned files found:")
        total_size = 0
        for filename in sorted(orphaned_files):
            filepath = os.path.join(uploads_dir, filename)
            if os.path.isfile(filepath):
                size = os.path.getsize(filepath)
                total_size += size
                print(f"   📄 {filename} ({size:,} bytes)")
        
        print(f"\n💾 Total space: {total_size:,} bytes ({total_size/1024/1024:.2f} MB)")
        
        response = input("\n❓ Delete these orphaned files? (y/N): ").lower().strip()
        if response == 'y':
            deleted_count = 0
            for filename in orphaned_files:
                filepath = os.path.join(uploads_dir, filename)
                try:
                    os.remove(filepath)
                    deleted_count += 1
                    print(f"   ✅ Deleted: {filename}")
                except OSError as e:
                    print(f"   ❌ Could not delete {filename}: {e}")
            
            print(f"\n🎉 Cleanup complete! Deleted {deleted_count} orphaned files.")
        else:
            print("   ℹ️  Cleanup cancelled.")
    else:
        print("   ✅ No orphaned files found!")

def list_file_usage():
    """Show detailed file usage statistics"""
    
    print("📈 File Usage Statistics")
    print("=" * 50)
    
    conn = sqlite3.connect('kuttiapp.db')
    cursor = conn.cursor()
    
    # News media files
    cursor.execute('SELECT COUNT(*) FROM news_media')
    news_count = cursor.fetchone()[0]
    print(f"📰 News media files: {news_count}")
    
    # Children photos
    cursor.execute("SELECT COUNT(*) FROM children WHERE photo IS NOT NULL AND photo != ''")
    children_count = cursor.fetchone()[0]
    print(f"👶 Children photos: {children_count}")
    
    # Mission photos
    cursor.execute("SELECT COUNT(*) FROM missions WHERE photo IS NOT NULL AND photo != ''")
    missions_count = cursor.fetchone()[0]
    print(f"🌍 Mission photos: {missions_count}")
    
    # User photos
    cursor.execute("SELECT COUNT(*) FROM users WHERE photo IS NOT NULL AND photo != ''")
    users_count = cursor.fetchone()[0]
    print(f"👤 User photos: {users_count}")
    
    conn.close()
    
    # Disk usage
    uploads_dir = 'uploads'
    if os.path.exists(uploads_dir):
        files = os.listdir(uploads_dir)
        total_size = sum(os.path.getsize(os.path.join(uploads_dir, f)) 
                        for f in files if os.path.isfile(os.path.join(uploads_dir, f)))
        print(f"💾 Total disk usage: {total_size:,} bytes ({total_size/1024/1024:.2f} MB)")
        print(f"📁 Files on disk: {len(files)}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'stats':
        list_file_usage()
    else:
        cleanup_orphaned_files()