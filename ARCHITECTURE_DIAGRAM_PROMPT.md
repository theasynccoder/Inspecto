# System Architecture Diagram Prompt for Gemini

## Project: Inspecto - AI-Powered Food Safety Inspection Management System

---

## PROMPT FOR GEMINI IMAGE GENERATION:

Create a detailed, professional system architecture diagram for an enterprise-level Food Safety Inspection Management Platform with the following specifications:

---

## 1. OVERALL ARCHITECTURE PATTERN

**Architecture Type**: Three-Tier Architecture (Presentation → Application → Data)

**Visual Style**: 
- Use boxes/containers for layers and components
- Use arrows for data flow and communication
- Color coding: Blue for frontend, Green for backend, Orange for external services, Red for database
- Include icons where appropriate (cloud, database, AI, users)
- Professional engineering diagram style (similar to AWS/Azure architecture diagrams)

---

## 2. ARCHITECTURE LAYERS (TOP TO BOTTOM)

### **LAYER 1: PRESENTATION LAYER** 
**Position**: Top of diagram
**Background Color**: Light Blue (#E3F2FD)

#### Components:
1. **Web Interface (EJS Templates)**
   - Technology: HTML5, CSS3, Bootstrap 5, EJS Templating Engine
   - Location: Server-Side Rendered Views
   
2. **Client-Side JavaScript**
   - Vanilla JavaScript for interactivity
   - Axios library for AJAX requests
   - Real-time form validation
   
3. **React Chatbot Interface**
   - Technology: React 19.1.0
   - Location: `/public/chatbot/` directory
   - Embedded widget in main application

#### User Interfaces (Show as separate boxes within Presentation Layer):
- **Super Admin Dashboard** → System-wide management interface
- **Admin Dashboard** → Zone-level management interface
- **Inspector Dashboard** → Field inspection interface
- **Public User Dashboard** → Restaurant search and complaints
- **Chatbot Interface** → Conversational AI for queries

**Data Flow Arrows**: Bidirectional arrows from all interfaces to Application Layer below

---

### **LAYER 2: APPLICATION LAYER**
**Position**: Middle of diagram
**Background Color**: Light Green (#E8F5E9)

#### Core Framework:
**Node.js Runtime** → Express.js 4.21.2 Framework

#### Sub-Components (Show as nested boxes):

**A. Route Controllers** (4 main controllers)
1. **superAdminRoutes.js**
   - Admin account management
   - System-wide statistics
   - Endpoint: `/superadmin/*`

2. **adminRoutes.js** (Largest controller - 1079 lines)
   - Inspector management (CRUD operations)
   - Restaurant approval workflow
   - Inspection report review
   - Complaint management with sentiment filters
   - Anomaly detection dashboard
   - PDF report generation
   - Endpoints: `/admin/*`

3. **inspectorRoutes.js**
   - Inspection scheduling view
   - Digital checklist submission
   - Restaurant registration
   - Image upload with GPS tagging
   - Past inspection history
   - Endpoints: `/inspector/*`

4. **userRoutes.js**
   - User registration/authentication
   - Restaurant search functionality
   - Complaint filing with auto-analysis
   - Favorites management
   - Endpoints: `/user/*`

5. **chatbotRoute.js**
   - Natural language query processing
   - Database information retrieval
   - Conversational memory management
   - Endpoint: `/food-chatbot`

**B. Business Logic Services** (Show as separate box)
1. **SentimentService.js**
   - AI-powered complaint analysis
   - Groq API integration (Llama 3.3 70B)
   - Rule-based fallback system
   - Urgency classification engine

2. **AnomalyService.js**
   - Statistical outlier detection (Z-score analysis)
   - AI pattern recognition
   - Inspector behavior analysis
   - Restaurant risk assessment

3. **PDFService.js**
   - HTML to PDF conversion
   - Report template rendering
   - EJS template processing

**C. Middleware Stack** (Show as horizontal bar)
- express-session → Session management
- express-validator → Input validation
- multer → File upload handling
- cookie-parser → Cookie processing
- body-parser → Request body parsing
- cors → Cross-origin resource sharing

**D. Authentication & Authorization Module**
- Session-based authentication
- Role-based access control (RBAC)
- Zone-based data isolation
- HttpOnly cookie security

**Data Flow Arrows**:
- Upward arrows to Presentation Layer
- Downward arrows to Data Layer
- Horizontal arrows to External Services (right side)

---

### **LAYER 3: DATA LAYER**
**Position**: Bottom of diagram
**Background Color**: Light Orange (#FFF3E0)

#### Primary Database:
**MySQL 8.0+** (Main storage)
- Connection Pooling: mysql2 library (10 concurrent connections)
- Connection Manager: `src/config/dbConnect.js`

#### Database Schema (Show as nested structure):

**Core Tables** (9 tables):

1. **users** 
   - Fields: email (PK), name, phone, password
   - Purpose: Public user accounts

2. **admins**
   - Fields: id (PK), name, email, zone, password
   - Purpose: Zone administrator accounts

3. **inspectors**
   - Fields: id (PK), name, email, zone, region, password
   - Purpose: Field inspector accounts

4. **restaurants**
   - Fields: id (PK), name, license_number, zone, region, hygiene_score, status, last_inspection_date
   - Status values: pending | approved | rejected
   - Purpose: Restaurant master records

5. **inspections**
   - Fields: id (PK), restaurant_id (FK), inspector_id (FK), inspection_date, status
   - Status values: Scheduled | Completed | Not-Scheduled
   - Purpose: Inspection scheduling

6. **inspection_reports**
   - Fields: id (PK), inspection_id (FK), report_json, image_paths, latitude, longitude, hygiene_score, status
   - Status values: pending | approved | rejected
   - Purpose: Submitted inspection data

7. **complaints**
   - Fields: id (PK), user_id (FK), restaurant_id (FK), message, sentiment, urgency, ai_analysis, status
   - Sentiment values: positive | neutral | negative
   - Urgency values: low | medium | high | critical
   - Purpose: User complaints with AI analysis

8. **favorites**
   - Fields: user_id (FK), restaurant_id (FK)
   - Purpose: User favorite restaurants

9. **anomaly_logs**
   - Fields: id (PK), analysis_type, zone, analysis_data, anomalies_found
   - Purpose: Audit trail for anomaly detection

**Relationships** (Show with connecting lines):
- inspections → restaurants (many-to-one)
- inspections → inspectors (many-to-one)
- inspection_reports → inspections (one-to-one)
- complaints → users (many-to-one)
- complaints → restaurants (many-to-one)
- favorites → users (many-to-one)
- favorites → restaurants (many-to-one)

---

## 3. EXTERNAL SERVICES (RIGHT SIDE OF DIAGRAM)
**Position**: Right side, connected to Application Layer
**Background Color**: Light Red (#FFEBEE)

### External Service Integrations:

1. **Groq AI Cloud Service**
   - Technology: Groq SDK 0.22.0
   - Model: Llama 3.3 70B Versatile
   - API Endpoint: Groq Cloud API
   - Use Cases:
     * Sentiment analysis (complaints)
     * Anomaly detection (inspection patterns)
     * Chatbot conversation generation
   - Configuration: `GROQ_API_KEY` in environment
   - Connection: HTTPS REST API

2. **Cloudinary Cloud Storage**
   - Technology: Cloudinary SDK 1.30.0
   - Purpose: Image storage and CDN delivery
   - Storage Path: `/fssai-inspections/` folder
   - Features:
     * Automatic image optimization
     * Thumbnail generation
     * CDN delivery
   - Configuration: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - Connection: HTTPS REST API + Multer integration

3. **Browser Geolocation API**
   - Technology: HTML5 Geolocation
   - Purpose: GPS coordinate capture during inspections
   - Data: latitude, longitude
   - Usage: Inspection authenticity verification

**Data Flow Arrows**:
- Bidirectional arrows from Application Layer to External Services
- Label arrows with data types (JSON, Images, Coordinates)

---

## 4. DATA FLOW PATHS (SHOW AS NUMBERED WORKFLOWS)

### Workflow 1: Inspector Inspection Submission
```
Inspector Dashboard → POST /inspection/submit/:id → 
inspectorRoutes.js → Multer Middleware (image upload) → 
Cloudinary (store images) → MySQL (save report + GPS) → 
Admin Dashboard (pending approval)
```

### Workflow 2: User Complaint with AI Analysis
```
User Dashboard → POST /user/complaint/:id → 
userRoutes.js → SentimentService.js → 
Groq AI API (analyze sentiment) → 
MySQL (store complaint + analysis) → 
Admin Dashboard (sorted by urgency)
```

### Workflow 3: Admin Anomaly Detection
```
Admin Dashboard → GET /admin/api/anomalies/analyze → 
adminRoutes.js → AnomalyService.js → 
MySQL (fetch reports) → Statistical Analysis → 
Groq AI API (pattern recognition) → 
JSON response (flagged anomalies) → 
Admin Dashboard (visualization)
```

### Workflow 4: Chatbot Query
```
User Query → POST /food-chatbot → 
chatbotRoute.js → Query Preprocessing → 
MySQL (data retrieval) → Context Building → 
Groq AI API (response generation) → 
JSON response → Chatbot UI
```

### Workflow 5: PDF Report Generation
```
Admin Dashboard → GET /admin/reports/:id/pdf → 
adminRoutes.js → PDFService.js → 
EJS Template Rendering → Puppeteer (HTML→PDF) → 
PDF Buffer → Browser Download
```

**Visual Representation**: Use different colored arrows for each workflow, with numbered steps

---

## 5. USER ROLES AND ACCESS CONTROL
**Position**: Left side of diagram or as overlay
**Show as hierarchical structure**:

```
┌─────────────────────────────────────┐
│         SUPER ADMINISTRATOR         │
│  - Manages all zones                │
│  - Creates admin accounts           │
│  - System-wide analytics            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      ZONE ADMINISTRATOR (Admin)     │
│  - Manages inspectors in zone       │
│  - Approves/rejects reports         │
│  - Restaurant approval workflow     │
│  - Complaint management             │
│  - Anomaly detection                │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│           INSPECTOR                 │
│  - Conducts field inspections       │
│  - Submits digital reports          │
│  - Uploads geotagged photos         │
│  - Registers restaurants            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         PUBLIC USER                 │
│  - Searches restaurants             │
│  - Views hygiene ratings            │
│  - Files complaints                 │
│  - Manages favorites                │
└─────────────────────────────────────┘
```

---

## 6. SECURITY LAYERS (SHOW AS SHIELD/LOCK ICONS)

**Session Security**:
- express-session middleware
- HttpOnly cookies
- 2-hour session expiry
- Server-side session storage

**Data Security**:
- Parameterized SQL queries (SQL injection prevention)
- express-validator (input sanitization)
- CORS configuration
- Environment variable protection (.env)

**File Upload Security**:
- File type restrictions (jpg, png, gif only)
- File size limit: 10MB max
- Cloudinary virus scanning

**Zone-Based Isolation**:
- Data filtered by zone/region
- Admins see only their zone data
- Inspectors restricted to assigned region

---

## 7. TECHNOLOGY STACK SUMMARY (BOTTOM LEGEND)

**Backend Technologies**:
- Node.js v20+
- Express.js 4.21.2
- MySQL2 (promise-based)
- EJS templating

**Frontend Technologies**:
- HTML5, CSS3, Bootstrap 5
- Vanilla JavaScript
- React 19.1.0 (chatbot)
- Axios for AJAX

**AI/ML Services**:
- Groq AI (Llama 3.3 70B)
- groq-sdk 0.22.0

**Cloud Services**:
- Cloudinary (images)
- Groq Cloud (AI)

**Libraries**:
- bcryptjs (planned - password hashing)
- Multer (file uploads)
- Puppeteer (PDF generation)
- express-session (authentication)
- express-validator (validation)

---

## 8. PERFORMANCE SPECIFICATIONS (ADD AS ANNOTATIONS)

- **Connection Pool**: 10 concurrent MySQL connections
- **Session Duration**: 2 hours
- **Image Upload**: 1-2 seconds per image
- **AI Analysis**: 2-3 seconds per request
- **PDF Generation**: 3-5 seconds per report
- **API Rate Limit**: 30 requests/minute (Groq free tier)

---

## 9. KEY FEATURES TO HIGHLIGHT (USE FEATURE BOXES)

1. **AI-Powered Sentiment Analysis** 
   - 87% accuracy
   - Automatic urgency classification
   - Rule-based fallback

2. **Anomaly Detection**
   - Statistical outlier detection
   - AI pattern recognition
   - Inspector bias detection

3. **Geolocation Verification**
   - GPS-tagged inspections
   - On-site verification
   - Fraud prevention

4. **Multi-Tenant Architecture**
   - Zone-based isolation
   - Decentralized administration
   - Scalable design

5. **Conversational AI Chatbot**
   - Natural language queries
   - Database information retrieval
   - Context-aware responses

---

## 10. DIAGRAM LAYOUT INSTRUCTIONS

**Orientation**: Vertical (top to bottom) with external services on the right

**Dimensions**: Wide format (16:9 aspect ratio)

**Detail Level**: High detail - include all component names, technologies, and data flows

**Color Scheme**: 
- Blues for frontend
- Greens for backend
- Oranges for database
- Reds for external services
- Grays for middleware/security

**Typography**:
- Layer headings: Bold, 18pt
- Component names: Regular, 12pt
- Technology names: Italic, 10pt
- Data flow labels: 8pt

**Icons**: Use appropriate icons for:
- Users (person icon)
- Database (cylinder icon)
- Cloud services (cloud icon)
- AI/ML (brain/robot icon)
- Security (lock/shield icon)
- API (gear icon)

---

## 11. SPECIFIC ELEMENTS TO INCLUDE

✅ All 4 main route controllers with endpoint prefixes
✅ All 3 service classes with their AI integrations
✅ All 9 database tables with relationships
✅ Both external services (Groq + Cloudinary)
✅ Session management and authentication flow
✅ Image upload pipeline with Multer
✅ 5 main data flow workflows (numbered and colored)
✅ 4 user role hierarchies
✅ Security layers and measures
✅ Technology stack legend
✅ Performance annotations
✅ Connection pooling details

---

## FINAL PROMPT SUMMARY FOR GEMINI:

"Create a professional, highly detailed system architecture diagram for 'Inspecto' - an AI-powered food safety inspection management platform. Use a three-tier architecture layout with Presentation Layer (top - blue), Application Layer (middle - green), and Data Layer (bottom - orange). Include external services on the right (red). Show all components mentioned above with proper icons, connecting arrows for data flow, and color-coded workflows. Make it suitable for an IEEE research paper or enterprise technical documentation. Include all database tables, services, routes, external APIs, and user roles. Use engineering diagram style similar to AWS/Azure architecture diagrams with high detail and professional aesthetics."

---

## ADDITIONAL CONTEXT FOR BETTER RESULTS:

- This is an enterprise-level regulatory technology (RegTech) platform
- System handles food safety inspections for government authorities
- Multi-stakeholder platform (4 user types)
- AI integration is a core feature (sentiment analysis + anomaly detection)
- System uses modern cloud-native architecture
- Zone-based multi-tenancy for geographic distribution
- Real-world deployment with ~100 users and ~100 complaints per month
- Focus on data flow, security, and AI integration in the visual design

---

**END OF ARCHITECTURE PROMPT**
