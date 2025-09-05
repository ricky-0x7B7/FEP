# KuttiApp - MultilKUTTIAPP is a webapp designed to be a small, easy-to-use application that empowers local referents to communicate more effectively with the families they support and with our organization.
In Tamil, "kutti" (குட்டி) is a colloquial word that means "child / little one" and it is used to address someone sweetly — like "sweetheart" or "little one" in Italian.
One of the features of KUTTIAPP is the ability to upload photos and videos, allowing local referents to share visual updates of the children and families they support, with instant translation between Tamil <--> Italian <--> English.ual Child Support Management System

#=================
#PROJECT OVERVIEW
#=================

##SCENARIO--------
In 1926 my granduncle left his small village in Italy to become a missionary in India.
He passed away in 2000, but his legacy lives on: after decades, my family kept supporting poor children in Tamil Nadu, India's southernmost state, thanks to hundreds of sponsors who sustain their education and basic needs.

The NGO "Amici Biellesi - Famiglie Senza Frontiere" was founded to continue this important mission, providing education and support to those in need.
One of the most challenging aspects of this distance support is maintaining a personal connection with the children and families we assist.

Local referents play a crucial role in bridging this gap, as they are often the ones who can provide updates, share stories, and convey the needs and aspirations of the families on the ground. They act as a vital link between the families and the organization, ensuring that the voices of those we support are heard and considered in our programs and initiatives.

But language barriers can still pose challenges in this communication process. Local referents may not always have the resources or training to effectively convey complex information, and cultural differences can lead to misunderstandings. It is essential for our organization to provide support and training to these local referents, equipping them with the tools they need to succeed in their roles.

## ===> here comes KUTTIAPP! <===

KUTTIAPP is a webapp designed to be a small, easy-to-use application that empowers local referents to communicate more effectively with the families of supporters and with our organization.
In Tamil, "kutti" (குட்டி) is a colloquial word that means "child / little one" and it is used to address someone sweetly — like “sweetheart” or “little one” in Italian.
One the feature of KUTTIAPP is the ability to upload photos and videos, allowing local referents to share visual updates of the children and families they support, with instant translation between Tamil <--> Italian <--> English. 
This can help to create a more personal connection and provide a better understanding of their daily lives.

##TECHNOLOGICAL STACK

KuttiApp is built using a lightweight fullstack approach, using Vite + React for the frontend and Flask with SQLite for the backend.
I preferred this stack instead of JSON-Server because the prototype uses a lot of media files, that SQLite handles more efficiently.

### Frontend Architecture
KuttiApp utilizes a modern React-based frontend built with Vite for optimal development experience and production performance.

**Core Technologies:**
- **React 18**: Component-based UI with modern hooks and functional components
- **Vite**: Fast development server with Hot Module Replacement and optimized builds
- **Redux Toolkit**: Global state management with integrated Redux Thunk for async operations
- **React Router**: Client-side routing with dynamic route parameters and protected routes
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Heroicons**: Professional SVG icon library

**State Management Strategy:**
The application implements a hybrid state management approach:
- Local component state using useState and useEffect hooks for UI-specific data
- Global application state via Redux for authentication, user sessions, and shared data
- Custom hooks for reusable stateful logic, particularly the useTranslatedField hook

**Component Architecture:**
The frontend is structured around 11+ reusable components organized by functionality:

```
src/
├── 📁 components/          # Reusable UI Components
├── 📁 pages/               # Route-level page components
├── 📁 hooks/               # Custom React hooks
├── 📁 contexts/            # React Context providers
├── 📁 store/               # Redux store configuration
├── 📁 routes/              # Routing configuration
├── 📁 i18n/                # Internationalization setup
└── 📁 utils/               # Utility functions and API clients
```

**Key Frontend Components:**
- **AdvancedFilterBar**: Complex filtering system with multiple criteria
- **EnhancedDataTable**: Feature-rich data tables with sorting, pagination, and export
- **DynamicForm**: Configurable form system with validation
- **MediaUploadField**: Advanced file upload with preview and progress tracking
- **NewsModal**: Content display with integrated translation capabilities

### Backend Architecture
The backend is built with Python Flask, providing a robust REST API with comprehensive data management capabilities.

**Core Backend Technologies:**
- **Flask**: Lightweight WSGI web framework for API development
- **SQLite**: Relational database with support for foreign keys and transactions
- **Werkzeug**: Security utilities for password hashing and request handling
- **Flask-CORS**: Cross-Origin Resource Sharing configuration

**Database Design:**
SQLite database with normalized schema supporting:
- Users with role-based permissions (admin, local_referent, sponsor)
- Missions with geographic data and referent assignments
- Children profiles with sponsor relationships
- News articles with multilingual content
- Translation cache for performance optimization

## Frontend Features and Implementation

### Routing System
React Router implementation with role-based access control:

**Public Routes:**
- `/` - Homepage with mission introduction
- `/login` - Authentication interface

**Protected Routes:**
- `/users` - Admin user management (admin only)
- `/children` - Children management with filtering
- `/children/:id` - Individual child detail pages
- `/missions` - Mission listing and management
- `/missions/:id` - Mission detail pages
- `/news` - News management system
- `/news/:id` - News article detail pages
- `/filter-demo` - Advanced filtering demonstration

### State Management Architecture
Redux Toolkit configuration with authentication slice:

```javascript
// Store configuration with Redux Thunk
export const store = configureStore({
  reducer: {
    auth: authSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true,
    }),
});
```

Authentication state includes user data, session management, and role-based permissions for UI rendering and route protection.

### Form System
Comprehensive form implementation with six validated forms:
1. **Authentication Form**: Login with credential validation
2. **User Management**: Admin user creation with role assignment
3. **Mission Management**: Geographic data with photo upload
4. **Children Management**: Profile management with sponsor assignment
5. **News Management**: Multilingual content with media upload
6. **File Upload**: Media handling with type and size validation

### API Integration
Frontend communicates with the Flask backend through a centralized API client using the Fetch API. Error handling, loading states, and response transformation are managed consistently across all components.

## Translation System with Google Deep Translator

### Implementation Overview
KuttiApp integrates Google Deep Translator API to provide seamless multilingual communication between Tamil, Italian, and English speakers.

### Architecture
**Translation Service (backend/translator.py):**
```python
class TranslationService:
    def __init__(self):
        self.cache_db = 'translations.db'
        self.supported_languages = ['en', 'it', 'ta']
    
    def translate_text(self, text, target_language, source_language='auto'):
        # Check cache first, then translate if needed
        # Store result in cache for future requests
```

**Key Features:**
- **Intelligent Caching**: Translations are stored in SQLite database to avoid redundant API calls
- **Automatic Language Detection**: Source language detection when not specified
- **Bidirectional Translation**: Support for Tamil ↔ Italian ↔ English
- **Field-Level Translation**: Entity-specific field translation with metadata tracking

### Frontend Integration
Custom React hook for seamless translation in components:

```javascript
export const useTranslatedField = (entityType, entityId, fieldName, targetLanguage, originalText) => {
  const [translatedText, setTranslatedText] = useState(originalText);
  const [isLoading, setIsLoading] = useState(false);
  
  // Translation logic with caching and error handling
};
```

This hook enables components to display content in the user's preferred language while maintaining the original text integrity.

## Internationalization with i18next

### Configuration
i18next setup for UI element translation across three languages:

```javascript
// i18n configuration
const resources = {
  en: { translation: { /* English UI translations */ } },
  it: { translation: { /* Italian UI translations */ } },
  ta: { translation: { /* Tamil UI translations */ } }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});
```

### Implementation Strategy
- **Static UI Translation**: Menu items, buttons, labels translated via i18next
- **Dynamic Content Translation**: User-generated content translated via Google Translator API
- **Language Persistence**: User language preference stored in localStorage
- **Fallback Handling**: Graceful degradation when translations are unavailable

## Demo Data Management Scripts

### Database Export System
**export_demo_data.py**: Comprehensive data export utility that creates a complete application snapshot:

```python
def export_demo_data():
    # Export all database tables to JSON
    # Copy media files to demo_data/uploads/
    # Generate metadata with export timestamp
    # Create importable data package
```

**Generated Package Structure:**
```
backend/demo_data/
├── 📁 metadata.json        # Export metadata and statistics
├── 📁 database_demo.json   # Complete database dump
└── 📁 uploads/             # Media files (59 files, ~26MB)
```

### Database Import System
**import_demo_data.py**: Intelligent import system that restores complete application state:

- Validates data integrity before import
- Handles foreign key relationships correctly
- Restores media files to proper locations
- Updates translation cache
- Provides detailed import logging

### Reset and Initialization
**reset_db.py**: Database initialization script that:
- Creates all required tables with proper foreign keys
- Sets up initial constraints and indexes
- Initializes translation cache database
- Prepares upload directories

## User Role System

### Role Definitions
**Admin**: Complete system access including user management, mission creation, and content moderation
**Local Referent**: Mission and child management within assigned locations, news creation capabilities
**Sponsor**: Read-only access to sponsored children profiles and related news content

### Permission Implementation
Role-based access control implemented at multiple levels:
- Route-level protection in React Router
- Component-level conditional rendering
- API endpoint authorization
- Database query filtering based on user role

## Development and Deployment

### Development Setup
```bash
# Frontend dependencies
npm install

# Backend virtual environment
python -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Database initialization
cd backend
python reset_db.py
python import_demo_data.py
```

### Production Considerations
- SQLite database suitable for small to medium deployments
- Static file serving through Flask for media content
- Translation cache optimization for performance
- Environment variable configuration for sensitive data

## Project Statistics

**Frontend Metrics:**
- 11+ reusable React components
- 10+ distinct pages with routing
- 6+ validated forms with real-world functionality
- 3-tier user role system with granular permissions

**Backend Metrics:**
- 20+ RESTful API endpoints
- 10 database tables with relational integrity
- 206+ cached translations across 3 languages
- 59 demo media files demonstrating file upload capabilities

**Demo Data Package:**
- 8 user accounts representing all roles
- 2 geographic missions in Tamil Nadu
- 10 children profiles with complete sponsor assignments
- 14 multilingual news articles with media attachments
- Complete translation cache for immediate testing

KuttiApp demonstrates comprehensive full-stack web development skills while addressing real-world humanitarian communication challenges through modern web technologies.
