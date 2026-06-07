# 🚀 PixelPost AI

PixelPost AI is a modern SaaS platform that instantly generates platform-optimized social media captions from images. Built with React, Node.js, and Supabase, it leverages advanced vision AI models (Groq / Llama 4) to automatically craft engaging posts tailored for Instagram, Twitter, and Facebook.

![PixelPost AI Architecture](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20Supabase-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features
* **Image-to-Caption AI:** Upload any image and let the AI analyze it to generate relevant captions.
* **Platform Optimization:** Generates unique content formats for Instagram (heavy hashtags, visual tone), Twitter (concise, witty), and Facebook (conversational).
* **"Bring Your Own Key" (BYOK):** Free users can bypass quotas by pasting their own OpenAI API key in the settings.
* **Authentication:** Secure Google OAuth and Email login via Firebase.
* **History Tracking:** All generated posts are securely saved and viewable in the dashboard via Supabase.

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite), Zustand (State), Tailwind CSS, Lucide Icons
* **Backend:** Node.js, Express, Firebase Admin SDK
* **Database:** Supabase (PostgreSQL)
* **AI Provider:** Groq SDK (Llama 4 Vision) & OpenAI (GPT-4o)
* **AI Optimization Microservice:** Python, FastAPI, TextBlob (Sentiment & Virality Scoring)
* **Deployment:** Render (Built-in `render.yaml` Blueprint)

---

## 💻 Local Installation

To run this project locally, you will need to set up both the frontend and backend environments.

### 1. Clone the repository
```bash
git clone https://github.com/BlackBoxJU50/PixelPost-Ai.git
cd PixelPost-Ai
```

### 2. AI Optimization Service (Python)
This AI/NLP microservice uses the `TextBlob` library to analyze generated captions. It calculates:
* **Sentiment Polarity:** How positive or negative the caption is.
* **Subjectivity:** Whether the text is fact-based or opinion-based.
* **Virality Score:** A custom algorithmic score (0-100) predicting post engagement based on length, sentiment strength, subjectivity, and hashtag density.

```bash
cd python-service
python3 -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### 3. Backend Setup
Open a new terminal tab:
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory with the following variables:
```env
PORT=5003
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
PYTHON_SERVICE_URL=http://localhost:8000

# Firebase Admin (Get from Firebase Service Accounts)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="..."

# Supabase (Database)
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Groq (AI Provider)
GROQ_API_KEY=...
```
Start the backend development server:
```bash
npm run dev
```

### 4. Frontend Setup
Open a new terminal tab:
```bash
cd frontend
npm install
```
Create a `.env.local` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5003

# Firebase Web Client
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```
Start the frontend development server:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

---

## 🚀 Production Deployment (Render)

This project includes a `render.yaml` Blueprint for zero-configuration deployments.

1. Create a free account on [Render.com](https://render.com).
2. Go to your Dashboard and select **New -> Blueprint**.
3. Connect this GitHub repository.
4. Render will automatically detect the backend and frontend services.
5. Provide the required Environment Variables in the Render dashboard when prompted.
6. Render's built-in CI/CD will automatically redeploy the app whenever you push to the `main` branch.

---

## 🔒 Security & Architecture Notes
* **API Keys:** User-provided OpenAI keys are hashed via SHA-256 before being stored in the database. Raw keys are never accessible.
* **Storage:** Image generation history utilizes heavily compressed Base64 Data URLs to bypass third-party storage fees while keeping database footprint minimal.
* **GDPR Compliance:** Deleting an account recursively wipes all associated Firebase auth data, Supabase records, and API keys.

---
*Maintained by [@BlackBoxJU50](https://github.com/BlackBoxJU50)*
