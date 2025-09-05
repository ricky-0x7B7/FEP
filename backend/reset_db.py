#!/usr/bin/env python3
"""
Script to reset and populate the database with fresh data
"""

import sqlite3
import os
from config import Config
from models import init_db

def reset_database():
    # Remove existing database file
    if os.path.exists(Config.DATABASE_PATH):
        os.remove(Config.DATABASE_PATH)
        print("✅ Removed existing database")
    
    # Initialize fresh database
    init_db()
    print("✅ Initialized fresh database")

if __name__ == "__main__":
    reset_database()
