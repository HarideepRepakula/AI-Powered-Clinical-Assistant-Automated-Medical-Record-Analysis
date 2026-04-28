# ClinIQ — AI-Augmented Clinical Assistant

An intelligent, full-stack healthcare platform that combines MERN technology with advanced AI capabilities to streamline clinical workflows and enhance patient care through automated medical record analysis, AI-powered clinical decision support, and intelligent chatbot assistance.

---

## 🎯 Overview

ClinIQ integrates multiple AI models to create a comprehensive healthcare management system:
- **BART** for intelligent medical record summarization and medication extraction
- **Ollama (Llama 3.2)** for clinical reasoning and RAG-based chatbot assistance
- **OpenFDA API** for real-time drug safety and contraindication checking

The platform supports role-based access for doctors, nurses, patients, and administrators with features ranging from appointment management to AI-assisted clinical documentation and prescription workflows.

---

## ✨ Key Features

### AI & Clinical Intelligence
- **Automated Medical Record Summarization** — BART-powered abstractive summaries and medication extraction from uploaded medical documents
- **Pre-Consultation Briefing** — Intelligent summaries automatically prepared for physicians before appointments
- **Intelligent Chatbot** — Ollama-based RAG system that answers clinical questions using comprehensive patient history and medical data as context
- **Consultation AI Scribe** — Automatically saves and organizes consultation transcripts with intelligent segmentation
- **Clinical Decision Support System (CDSS)** — Real-time drug interaction checking via OpenFDA API with AI-powered clinical reasoning
- **Personalized Health Insights** — AI-generated wellness recommendations based on patient lab results and medical history

### Clinical Workflow Management
- **Role-Based Dashboards** — Specialized interfaces for doctors, nurses, patients, and administrators
- **Appointment Management** — Booking, scheduling, and consultation coordination
- **Digital Prescriptions** — Online prescription creation with automatic pharmacy integration
- **Medical Record Management** — Secure upload and OCR-based text extraction from medical documents
- **Lab Result Processing** — Structured lab data parsing with clinical flagging
- **Video Consultations** — Integrated Jitsi Meet for remote appointments
- **Escalation System** — Intelligent patient query routing to appropriate physicians

### Security & Infrastructure
- **JWT Authentication** — Secure token-based authentication with refresh token support
- **Role-Based Access Control (RBAC)** — Fine-grained permission management
- **Real-Time Notifications** — Instant alerts for appointments, prescriptions, and clinical updates
- **Pharmacy Inventory Management** — Stock tracking and order fulfillment
- **Schedule Management** — Doctor availability slots and appointment blocking

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| **Backend** | Node.js, Express.js, MongoDB, Mongoose ODM |
| **Frontend** | React, Vite, TailwindCSS |
| **AI Summarization** | Python, BART (`facebook/bart-large-cnn`), PyTorch, pdfplumber |
| **Clinical AI** | Ollama (Llama 3.2) for local inference |
| **Drug Safety** | OpenFDA REST API |
| **Authentication** | JWT + bcrypt hashing |
| **Video Conferencing** | Jitsi Meet |
| **Document Processing** | pdfplumber, Tesseract OCR |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas or local MongoDB instance
- Python 3.8+ with pip
- Ollama with Llama 3.2 model (optional for full AI features)

### 1. Install Dependencies

```bash
# Backend setup
cd backend
npm install

# Frontend setup
cd ../frontend
npm install

# Python dependencies (for BART summarization)
pip install torch transformers pdfplumber pytesseract
```

### 2. Environment Configuration

Create `backend/.env`:
```env
MONGO_URI=<your-mongodb-connection-uri>
JWT_SECRET=<your-secure-jwt-secret>
UPLOADS_BASE_URL=http://127.0.0.1:4000/uploads
OLLAMA_BASE_URL=http://localhost:11434
```

### 3. Start the Application

**Terminal 1 — Backend API (port 4000):**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend (port 5173):**
```bash
cd frontend
npm run dev
```

**Note:** Ensure MongoDB and Ollama services are running before starting the application.

---

## 📋 API Documentation

### Authentication
- `POST /api/auth/login` — User login
- `POST /api/auth/signup` — User registration
- `POST /api/auth/refresh` — Refresh authentication token

### AI & Clinical Features
- `GET /api/ai/pre-consult-summary/:appointmentId` — Retrieve AI-generated pre-consultation briefing
- `POST /api/ai/cdss-check` — Check drug interactions and clinical warnings
- `GET /api/ai/health-insights` — Get personalized health recommendations
- `POST /api/ai/bart-summary` — Generate document summary
- `POST /api/ai/save-transcript` — Save consultation transcript

### Chatbot & Patient Support
- `POST /api/chatbot/ask` — Query general RAG chatbot
- `POST /api/chatbot/ask-consultation` — Query consultation-specific chatbot
- `POST /api/chatbot/escalate` — Escalate patient query to physician

### Clinical Management
- `GET /api/appointments` — List appointments
- `POST /api/appointments` — Create appointment
- `GET /api/doctors` — List available physicians
- `POST /api/prescriptions` — Create prescription
- `POST /api/medical-records/upload` — Upload medical record

---

## 📁 Project Structure

```
ClinIQ/
├── backend/
│   ├── summarize.py                     # BART summarization engine
│   ├── package.json
│   └── src/
│       ├── app.js                       # Express application
│       ├── controllers/
│       │   ├── ai.controller.js         # AI features (BART, CDSS)
│       │   ├── chatbot.controller.js    # Chatbot & escalation
│       │   ├── appointment.controller.js
│       │   ├── medicalRecords.controller.js
│       │   ├── prescription.controller.js
│       │   ├── pharmacy.controller.js
│       │   ├── doctor.controller.js
│       │   └── ...
│       ├── services/
│       │   ├── ollamaService.js         # Ollama integration
│       │   ├── notificationService.js
│       │   ├── authService.js
│       │   └── appointmentService.js
│       ├── models/
│       │   ├── User.js
│       │   ├── Appointment.js
│       │   ├── MedicalRecord.js
│       │   ├── Prescription.js
│       │   └── ...
│       ├── routes/
│       │   ├── ai.routes.js
│       │   ├── chatbot.routes.js
│       │   ├── appointment.routes.js
│       │   └── ...
│       └── middleware/
│           ├── auth.js
│           ├── rbac.js
│           └── validation.js
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── components/
        │   ├── AIHealthInsights.jsx
        │   ├── AIScribe.jsx
        │   ├── CDSSAlert.jsx
        │   ├── AppointmentBooking.jsx
        │   ├── PharmacyStore.jsx
        │   └── ...
        ├── pages/
        │   ├── Home.jsx
        │   ├── Login.jsx
        │   ├── Signup.jsx
        │   └── dashboards/
        │       ├── Doctor.jsx
        │       ├── Patient.jsx
        │       └── Admin.jsx
        └── services/
            ├── api.js
            └── ...
```

---

## 🔒 Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens include expiration and refresh token rotation
- RBAC middleware enforces role-based access control
- Input validation on all API endpoints
- Secure handling of sensitive medical data

---

## 📝 License

This project is provided as-is for educational and commercial use.

---

## 👥 Contributing

Contributions are welcome. Please ensure code follows project conventions and includes appropriate documentation.

---

## 📞 Support

For issues, questions, or feature requests, please open an issue in the project repository.
