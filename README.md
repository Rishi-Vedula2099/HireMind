# HireMind AI 🧠

> **A fully personalized AI interviewer that simulates real hiring pipelines based on your resume, target role, and company.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org) [![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)](https://fastapi.tiangolo.com) [![Python](https://img.shields.io/badge/Python-3.12-blue)](https://python.org)

---

## 🎯 What Makes HireMind Different

| ❌ Generic Mock Interviews | ✅ HireMind |
|---|---|
| Random Leetcode questions | Resume-aware questioning |
| Generic feedback | FAANG-level evaluator rubric |
| No company context | Google/Amazon/Microsoft simulation |
| Static difficulty | Adaptive — gets harder when you improve |
| Text only | Voice mode (Whisper STT) |

---

## 🧱 Architecture

```
User
 └─ Upload Resume + Job Role + Company
      └─ Resume Analyzer (LLM + Embeddings)
      └─ Interview Planner AI
           └─ Multi-Round Interview Engine
                → DSA (Adaptive difficulty)
                → System Design
                → Behavioral (Company-specific)
           └─ Evaluator (FAANG rubric)
      └─ Final Report (Hire / No Hire)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Zustand |
| Backend | FastAPI, SQLAlchemy (async), Pydantic |
| AI | OpenAI GPT-4o, Whisper STT, FAISS embeddings |
| Queue | Celery + Redis |
| Database | PostgreSQL |
| Auth | Clerk |
| Payments | Stripe |
| Deploy | Vercel (fe) + Railway/Render (be) |

---

## 📁 Project Structure

```
HireMind/
├── frontend/           # Next.js App
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── dashboard/            # User dashboard
│   │   ├── interview/
│   │   │   ├── setup/            # Configure interview
│   │   │   └── [id]/             # Live interview screen
│   │   └── report/[id]/          # Post-interview report
│   └── lib/
│       ├── api.ts                # API service layer
│       └── stores/               # Zustand state stores
│
├── backend/            # FastAPI
│   ├── main.py
│   ├── api/            # Route handlers
│   ├── services/       # Business logic
│   ├── db/             # SQLAlchemy models
│   ├── workers/        # Celery tasks
│   └── requirements.txt
│
├── ai-engine/          # AI Core
│   ├── datasets/       # Interview questions (DSA, SD, Behavioral)
│   ├── prompts/        # LLM prompt templates
│   ├── pipelines/      # Interview + resume pipelines
│   └── embeddings/     # FAISS vector store
│
└── docker/             # Docker Compose setup
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- PostgreSQL
- Redis
- OpenAI API key
- Clerk account
- Stripe account

### 1. Clone & Setup

```bash
git clone https://github.com/Rishi-Vedula2099/HireMind.git
cd HireMind
cp .env.example backend/.env
cp .env.example frontend/.env.local
```

Fill in all API keys in both `.env` files.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### 3. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000/docs
```

### 4. Background Worker

```bash
cd backend
celery -A workers.celery_worker worker --loglevel=info
```

### 5. Docker (Full Stack)

```bash
docker compose -f docker/docker-compose.yml up -d
```

---

## 🤖 AI Interview Flow

1. **Resume Upload** → AI extracts skills, experience level, weak areas
2. **Plan Generation** → AI creates company-specific multi-round plan
3. **Hybrid Questions** → Dataset questions + LLM personalization
4. **Adaptive Evaluation** → FAANG-rubric scoring, auto difficulty adjustment
5. **Final Report** → Hire / No Hire + improvement roadmap

---

## 📊 Example Interview Plan (Google, Senior SDE)

```json
[
  { "round": "DSA", "difficulty": "medium", "num_questions": 2 },
  { "round": "DSA", "difficulty": "hard",   "num_questions": 2 },
  { "round": "System Design", "difficulty": "hard", "num_questions": 1 },
  { "round": "Behavioral", "difficulty": "medium", "num_questions": 1 }
]
```

---

## 💳 Pricing

| Free | Pro ($19/mo) |
|---|---|
| 2 interviews/day | Unlimited |
| All round types | Company-specific simulation |
| Text mode | Voice mode + PDF reports |

---

## 📄 License

MIT — Built for candidates who refuse to settle.
