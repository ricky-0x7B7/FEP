# SQLite models and database initialization for KuttiApp backend
# All comments, variable names, and table names are in English


import sqlite3
from config import Config


def get_db_connection():
    try:
        conn = sqlite3.connect(Config.DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        # Enable foreign key support
        conn.execute('PRAGMA foreign_keys = ON')
        return conn
    except sqlite3.Error as e:
        print(f"Database connection error: {str(e)}")
        raise

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'sponsor', 'referent', 'local_referent')),
        photo TEXT,
        email TEXT,
        phone TEXT,
        full_name TEXT,
        bio TEXT,
        ui_language TEXT DEFAULT 'en'
    )''')
    # Missions table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS missions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        photo TEXT,
        referent_id INTEGER,
        FOREIGN KEY (referent_id) REFERENCES users(id)
    )''')
    # Referents table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS referents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )''')
    # Children table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS children (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        photo TEXT,
        birth DATE,
        gender TEXT,
        description TEXT,
        mission_id INTEGER,
        sponsor_id INTEGER,
        FOREIGN KEY (mission_id) REFERENCES missions(id),
        FOREIGN KEY (sponsor_id) REFERENCES sponsors(id)
    )''')
    # Sponsors table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sponsors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        surname TEXT,
        email TEXT,
        phone TEXT
    )''')
    # Sponsor-children relationship
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sponsor_children (
        sponsor_id INTEGER,
        child_id INTEGER,
        PRIMARY KEY (sponsor_id, child_id),
        FOREIGN KEY (sponsor_id) REFERENCES sponsors(id),
        FOREIGN KEY (child_id) REFERENCES children(id)
    )''')
    # News table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        referent_id INTEGER,
        child_id INTEGER,
        date DATE,
        title TEXT,
        content TEXT,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER,
        updated_at TIMESTAMP,
        FOREIGN KEY (referent_id) REFERENCES referents(id),
        FOREIGN KEY (child_id) REFERENCES children(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
    )''')
    # News media table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS news_media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        news_id INTEGER,
        media_type TEXT CHECK(media_type IN ('photo', 'video')),
        media_path TEXT,
        description TEXT,
        media_order INTEGER DEFAULT 0,
        FOREIGN KEY (news_id) REFERENCES news(id)
    )''')
    
    # Translations table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS translations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        field_name TEXT NOT NULL,
        language TEXT NOT NULL,
        translated_text TEXT NOT NULL,
        source_language TEXT,
        is_original INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    # Check and add missing columns to existing tables after creation
    try:
        cursor.execute("PRAGMA table_info(children)")
        columns = [column[1] for column in cursor.fetchall()]
        if 'description' not in columns:
            cursor.execute('ALTER TABLE children ADD COLUMN description TEXT')
            print("Added description column to children table")
        if 'sponsor_id' not in columns:
            cursor.execute('ALTER TABLE children ADD COLUMN sponsor_id INTEGER REFERENCES sponsors(id)')
            print("Added sponsor_id column to children table")
    except sqlite3.Error as e:
        print(f"Error checking/adding children columns: {e}")
    
    try:
        cursor.execute("PRAGMA table_info(news)")
        news_columns = [column[1] for column in cursor.fetchall()]
        
        if 'created_by' not in news_columns:
            cursor.execute('ALTER TABLE news ADD COLUMN created_by INTEGER')
            print("Added created_by column to news table")
            
        if 'created_at' not in news_columns:
            cursor.execute('ALTER TABLE news ADD COLUMN created_at TIMESTAMP')
            print("Added created_at column to news table")
            
        if 'updated_by' not in news_columns:
            cursor.execute('ALTER TABLE news ADD COLUMN updated_by INTEGER')
            print("Added updated_by column to news table")
            
        if 'updated_at' not in news_columns:
            cursor.execute('ALTER TABLE news ADD COLUMN updated_at TIMESTAMP')
            print("Added updated_at column to news table")
            
    except sqlite3.Error as e:
        print(f"Error checking/adding news columns: {e}")
    
    try:
        cursor.execute("PRAGMA table_info(news_media)")
        media_columns = [column[1] for column in cursor.fetchall()]
        
        if 'description' not in media_columns:
            cursor.execute('ALTER TABLE news_media ADD COLUMN description TEXT')
            print("Added description column to news_media table")
            
        if 'media_order' not in media_columns:
            cursor.execute('ALTER TABLE news_media ADD COLUMN media_order INTEGER DEFAULT 0')
            print("Added media_order column to news_media table")
            
    except sqlite3.Error as e:
        print(f"Error checking/adding news_media columns: {e}")
    
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print('Database initialized.')
