# Configuration loader for KuttiApp backend
# Loads environment variables for secrets and paths

import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent / '.env')

class Config:
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'default_secret')
    DATABASE_PATH = os.getenv('DATABASE_PATH', str(Path(__file__).parent / 'kuttiapp.db'))
