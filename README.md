# 🐾 PawBrief — AI-Assisted Stray Animal Rescue to Vet Handoff
### Final Working Prototype & Clinical Coordination System

> **One-Line Pitch:** PawBrief turns a scattered citizen report about an injured stray animal into a traceable, source-aware rescue-to-vet handoff using Google Cloud, Vertex AI / Gemini Multimodal, Maps Platform, and Firebase.

---

## ⚡ 1. Windows Run Instructions & Quickstart

### Prerequisites
- **Node.js**: v20 or higher (v24.18.0 tested & verified)
- **Modern Browser**: Chrome, Edge, or Firefox

### Startup Options

#### Option A: One-Click Startup (Windows)
Double-click `start.bat` in the project root:
```cmd
start.bat
```
This automatically launches the API backend server on `http://localhost:8085` and opens the web application in your default browser. (Note: If port 8085 is in use, the server automatically tries 8086–8095).

#### Option B: Terminal Startup (PowerShell / Command Prompt)
1. **Navigate to backend and install dependencies:**
   ```powershell
   cd backend
   npm install
   ```
2. **Start the API Server:**
   ```powershell
   node server.js
   ```
3. **Open the Web Application:**
   Open `http://localhost:8085` in Google Chrome or Edge.

#### Running the Automated Test Suite (Scenarios A through O)
From the project root:
```powershell
npm test
```
Or from the `backend/` directory:
```powershell
node test/pawbrief.test.js
```

---

## 🌟 2. Feature Audit

| Feature Area | Original State | Changes & Enhancements Made | Current Status | Remaining Gaps / Future Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Multilingual Intake** | Basic text inputs with English prompt | Added **“Intake Translation & Vernacular Provenance”** card; preserves original Hindi/Marathi transcript; generates separate English vet summary; generates unknown gaps in native vernacular; flags uncertainties. | **Fully Functional** | Dialectal audio transcription depends on browser Web Speech API support. |
| **Multimodal Photo Analysis** | Basic base64 forward with generic description | Strict file validation (<5MB, MIME checking); Gemini prompt constrained to 50–100 words of strictly physical visible traits; explicit non-diagnostic label; honest fallback if offline. | **Fully Functional** | Direct streaming to Google Cloud Storage signed URLs planned for production. |
| **Review AI Brief Screen** | Single freeform text area | Separated into distinct blocks: (A) English Vet Summary, (B) Reported Observations, (C) Unknowns in vernacular, (D) Questions vs Answers blocks, (E) Non-diagnostic photo observations, (F) Urgency triage. | **Fully Functional** | Citizen voice correction for answers. |
| **TrustTrace Audit Trail** | Simple client-side pill badges | Role-gated observation provenance (`citizen`, `rescuer`, `veterinarian`, `AI-visual-context`); server-enforced RBAC blocks non-vets from confirming clinical details. | **Fully Functional** | Cryptographic content hashing on blockchain / ledger for enterprise tier. |
| **Rescue Lifecycle** | 4 simple statuses | Expanded to full real-world lifecycle (`reported`, `awaiting-assignment`, `assigned`, `accepted`, `rescuer-en-route`, `animal-reached`, `handed-to-vet`, `vet-assessment-recorded`, `resolved`, `cancelled`). | **Fully Functional** | Real-time GPS rescuer van tracking websocket. |
| **Unaccepted Case Alerts** | Basic metric count | Red escalation alert banner when case is unattended for >30 minutes with elapsed timer and dispatcher filter action. | **Fully Functional** | SMS/Twilio dispatcher phone alert gateway. |
| **Duplicate & Suspicion Detection** | None | Haversine geospatial proximity (<2km), temporal check (<12h), and symptom overlap scoring; flags for review without auto-rejecting; reviewer resolution actions. | **Fully Functional** | Deep image feature vector embedding similarity. |
| **Emergency Prioritization** | None | 4-tier triage (`emergency`, `urgent`, `routine`, `pending`) with transparent clinical trigger explanation and human override with audit logging. | **Fully Functional** | Automated physiological vitals intake. |
| **Nearby Veterinary Discovery** | Hardcoded clinic text | Real GPS/query clinic discovery via Google Places API + verified regional 24/7 emergency clinic directory fallback with phone numbers, hours, distance, and direct Google Maps links. | **Fully Functional** | Real-time emergency bed availability sync. |
| **WhatsApp Rescue Sharing** | None | Dedicated WhatsApp share button with review modal; URL-encoded message; privacy options (redact exact GPS, omit finder phone); desktop and mobile support. | **Fully Functional** | Official WhatsApp Business API direct bot webhook. |
| **Persistent Shared Storage** | Browser `sessionStorage` only | Server-backed persistent shared JSON store (`backend/data/cases.json`); cases survive restarts and sync across all browser tabs; Firestore sync ready. | **Fully Functional** | Multi-region distributed Cloud Spanner / Firestore clustering. |
| **Security & RBAC** | Client UI role switcher only | Server-side role authorization checks: `/api/cases/:id/verify` returns HTTP 403 Forbidden if non-vets attempt clinical confirmation; rate limiting; file limits. | **Fully Functional** | Firebase custom claims verification via Firebase Admin SDK with signed JWTs. |

---

## 🧪 3. Comprehensive Test Report (Scenarios A through O)

All 15 scenarios specified in the master prompt were automated in `backend/test/pawbrief.test.js` and verified:

| Scenario | Objective Tested | Result | Live Service Dependency & Fallback Behavior |
| :--- | :--- | :---: | :--- |
| **Scenario A** | English report structuring & brief fields | **PASSED** | Uses Gemini API if configured; graceful heuristic structure fallback if offline. |
| **Scenario B** | Marathi report: Preserves Marathi text, English vet summary, Marathi unknowns | **PASSED** | Vernacular preserved; unknown questions produced in Marathi script. |
| **Scenario C** | Hindi report: Preserves Hindi text, English vet summary, Hindi unknowns | **PASSED** | Vernacular preserved; unknown questions produced in Hindi script. |
| **Scenario D** | Image upload: Non-diagnostic visual context & safety disclaimer | **PASSED** | Verified: never claims medical diagnosis from image; displays required disclaimer. |
| **Scenario E** | Separate questions and answers blocks (no fabricated answers) | **PASSED** | Verified: follow-up questions generated, answers remain un-fabricated until answered. |
| **Scenario F** | Rescue tracking: Lifecycle status transitions & event timestamps | **PASSED** | Verified: full lifecycle state changes, recorded actors, and event audit history. |
| **Scenario G** | Unaccepted case: Waiting state & escalation calculation | **PASSED** | Verified: cases waiting >30 minutes trigger urgent alert status. |
| **Scenario H** | Duplicate detection: Proximity & temporal matching flags for human review | **PASSED** | Verified: 2nd report within 100m flagged with similarity score without auto-rejection. |
| **Scenario I** | Emergency prioritization: Urgency triage & human override | **PASSED** | Verified: severe symptoms trigger Emergency; coordinator can override priority. |
| **Scenario J** | Nearby vet discovery: Real location search and verified directory fallback | **PASSED** | Verified: returns real 24/7 hospitals, distances, phone numbers, and Maps links. |
| **Scenario K** | WhatsApp sharing: Message formatting, URL-encoding & privacy redactions | **PASSED** | Verified: valid URL encoding, case ID, summary, and location links without raw spaces. |
| **Scenario L** | Security RBAC: Unauthorized vet-confirmation attempt denied with HTTP 403 | **PASSED** | Verified: reporter/rescuer calls to `/verify` return HTTP 403 Forbidden; vet call succeeds. |
| **Scenario M** | Shared persistence: Case persists and is returned in subsequent requests | **PASSED** | Verified: created case is saved to disk and retrievable across separate HTTP requests. |
| **Scenario N** | Privacy protection: Server payload limits and input sanitization | **PASSED** | Verified: oversized payloads (>8MB) rejected with HTTP 413/400. |
| **Scenario O** | Failure handling: Graceful handling of missing fields and offline mode | **PASSED** | Verified: invalid inputs return 400 Bad Request; health endpoint declares status. |

**Overall Automated Test Result:** `15 Passed, 0 Failed (100% Pass Rate)`

---

## ⚙️ 4. Configuration Guide

PawBrief is designed to work **both in zero-credential demonstration mode** and **with live Google Cloud / Firebase credentials**.

### Step 1: Create your `.env` file
Copy the provided `.env.example` template:
```powershell
cp .env.example .env
```

### Step 2: Configure External Services

#### 1. Google Gemini AI Service
- **Google AI Studio API Key (Simplest)**:
  1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey) and generate an API key.
  2. Set `GEMINI_API_KEY=AIzaSy...` in `.env`.
  3. Set `GEMINI_MODEL=gemini-2.5-flash`.
- **Google Cloud Vertex AI (Enterprise / Cloud Run)**:
  1. Create a Google Cloud Project with Vertex AI API enabled.
  2. Set `GCP_PROJECT_ID=your-project-id` and `GCP_LOCATION=us-central1`.
  3. Ensure your environment has Application Default Credentials configured (`gcloud auth application-default login`).

#### 2. Google Maps Platform & Google Places API
- Visit [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
- Enable: **Maps JavaScript API**, **Places API (New)**, and **Geocoding API**.
- Set in `.env`:
  ```env
  GOOGLE_MAPS_API_KEY=AIzaSy...
  GOOGLE_PLACES_API_KEY=AIzaSy...
  ```
- *Browser Security:* In Google Cloud Console, restrict `GOOGLE_MAPS_API_KEY` to HTTP referrers (`localhost`, your domain), while keeping `GOOGLE_PLACES_API_KEY` restricted to backend IP / server calls.

#### 3. Firebase Authentication & Cloud Firestore
- Visit [Firebase Console](https://console.firebase.google.com) and create a Web App.
- Set in `.env`:
  ```env
  FIREBASE_API_KEY=AIzaSy...
  FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
  FIREBASE_PROJECT_ID=your-project-id
  ```
- The frontend dynamically loads Firebase Auth for Google Sign-In when valid keys are provided.

---

## 🔒 5. Security & Privacy Review

### Implemented Safeguards
1. **Server-Enforced RBAC**: Client-side role switching is purely for UI convenience. The backend API (`/api/cases/:id/verify`) rejects non-veterinarians with `403 Forbidden` if they attempt to record a `vet-confirmed` observation.
2. **Non-Diagnostic Medical Boundary**: AI models are prompted with explicit negative constraints against clinical diagnosis. Code-level rules and UI badges explicitly label visual outputs: *"AI-generated visual observations — not a veterinary diagnosis. Human review required."*
3. **Sensitive Data Redaction**: WhatsApp sharing includes privacy toggles to redact exact GPS coordinates into approximate landmarks and prevents accidental exposure of a citizen finder's private telephone number.
4. **Denial of Service & Abuse Prevention**:
   - In-memory rate limiting (60 requests/minute per IP) on expensive AI endpoints.
   - Strict 8MB JSON body limit and 5MB image limit.
   - Client and server-side image optimization.

### Production Limitations & Disclosure
- **Demonstration Tokens**: In this standalone prototype, user roles are passed via trusted headers (`x-user-role`). In full multi-tenant production, this should be paired with verified Firebase ID Tokens decoded via Firebase Admin SDK with custom claims.
- **Location Obfuscation**: Exact GPS coordinates are currently stored in `backend/data/cases.json`. In production, coordinate precision should be truncated for unauthorized or public read APIs to prevent stray animal exploitation.

---

## 📦 6. Deliverable Archive

The finished prototype has been packaged into:
`PawBrief_Final_Prototype.zip`

This ZIP contains:
- Complete modified backend (`backend/server.js`, `backend/package.json`, `backend/.env.example`)
- Complete modified frontend (`public/index.html`, `index.html`)
- Automated test suite (`backend/test/pawbrief.test.js`)
- Root server scripts (`server.js`, `package.json`, `start.bat`)
- Configuration templates (`.env.example`)
- Complete documentation (`README.md`)
- Excludes heavy transient directories (`node_modules`) to keep the archive compact and clean.
