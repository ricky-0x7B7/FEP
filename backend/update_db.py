#!/usr/bin/env python3
"""
Script to update the database schema and add description field to missions table
"""

import sqlite3
from config import Config
from models import get_db_connection

def update_database():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if description column exists
        cursor.execute("PRAGMA table_info(missions)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'description' not in columns:
            print("Adding description column to missions table...")
            cursor.execute("ALTER TABLE missions ADD COLUMN description TEXT")
            
            # Update existing missions with sample descriptions
            cursor.execute("""
                UPDATE missions 
                SET description = 'The ' || name || ' mission is dedicated to supporting children and families in this beautiful region of Tamil Nadu. Through education, healthcare, and community programs, we work together to create lasting positive change in the lives of those we serve.'
                WHERE description IS NULL
            """)
            
            # Add specific descriptions for known missions
            cursor.execute("""
                UPDATE missions 
                SET description = 'The Wellington mission is located in the heart of Tamil Nadu, where we work closely with local families to provide educational opportunities and healthcare support. Our dedicated team focuses on creating sustainable programs that empower children and strengthen community bonds through collaborative efforts.'
                WHERE name = 'Wellington'
            """)
            
            cursor.execute("""
                UPDATE missions 
                SET description = 'Our Orissa mission serves rural communities with comprehensive support programs including education, nutrition, and healthcare initiatives. We believe in building lasting relationships with families while preserving local traditions and fostering economic development through skill-building programs.'
                WHERE name = 'Orissa'
            """)
            
            conn.commit()
            print("✅ Missions description column updated successfully!")
        else:
            print("✅ Description column already exists!")
        
        # Check and create translations table for multilingual support
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='translations'")
        if not cursor.fetchone():
            print("Creating translations table for multilingual support...")
            cursor.execute('''
                CREATE TABLE translations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    entity_type TEXT NOT NULL,
                    entity_id INTEGER NOT NULL,
                    field_name TEXT NOT NULL,
                    language TEXT NOT NULL,
                    translated_text TEXT NOT NULL,
                    source_language TEXT,
                    is_original BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(entity_type, entity_id, field_name, language)
                )
            ''')
            
            # Add performance indexes
            cursor.execute('''
                CREATE INDEX idx_translations_lookup 
                ON translations(entity_type, entity_id, field_name, language)
            ''')
            
            cursor.execute('''
                CREATE INDEX idx_translations_entity 
                ON translations(entity_type, entity_id)
            ''')
            
            conn.commit()
            print("✅ Translations table created successfully!")
        else:
            print("✅ Translations table already exists!")
            
    except Exception as e:
        print(f"❌ Error updating database: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    update_database()
