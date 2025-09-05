## Manual Installation

### Prerequisites
- **Node.js** v16+ (with npm)
- **Python** 3.8+
- **pip** (Python package installer)
- **venv** (Virtual environment)

### Step-by-Step Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/ricky-0x7B7/FEP
   cd FEP
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

3. **Setup Python Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # macOS/Linux
   # Windows: venv\Scripts\activate
   ```

4. **Install Backend Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

5. **Initialize Database with Demo Data**
   ```bash
   python reset_db.py
   python import_demo_data.py
   ```

6. **Start Application**
   
   **Backend (Terminal 1):**
   ```bash
   source venv/bin/activate
   cd backend
   python app.py
   ```
   
   **Frontend (Terminal 2):**
   ```bash
   npm run dev
   ```

## Demo Data Package

KuttiApp includes comprehensive demo data:

### Database Statistics
- **8 Users**: Complete user profiles with roles
- **2 Missions**: Tamil Nadu geographic missions
- **10 Children**: Full profiles with photos and sponsors
- **14 News Articles**: Multilingual content with media
- **59 Media Files**: Photos and videos (26MB total)
- **206 Translations**: Pre-cached in 3 languages
- **281 Total Records**: Across 10 database tables

### Demo Accounts

| Role | Username | Password | Access Level |
|------|----------|----------|-------------|
| **Admin** | admin | admin123 | Full system access, user management |
| **Referent** | referent1 | referent123 | Mission and child management |
| **Sponsor** | sponsor1 | sponsor123 | View sponsored children and news |
