# Kushal Chat AI

Kushal Chat AI is a modern, responsive, and production-quality AI chatbot application.

## Architecture

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, PWA, Netlify hosting.
- **Backend:** FastAPI, Python 3.11+, async SQLAlchemy 2.0, asyncpg.
- **Database:** PostgreSQL (source of truth for users, conversations, and messages).
- **Authentication:** Firebase Authentication (Sign in with Google, verified server-side).
- **AI Service:** OpenRouter API with Server-Sent Events (SSE) streaming.

## Project Structure

```text
kushl-chatbot/
├── backend/
│   ├── app/
│   │   ├── api/             # API routers (health, conversations, chat)
│   │   ├── core/            # Configuration, database engine, security
│   │   ├── models/          # SQLAlchemy async models (User, Conversation, Message)
│   │   ├── schemas/         # Pydantic v2 validation schemas
│   │   ├── services/        # OpenRouter SSE streaming service
│   │   └── main.py          # FastAPI application entrypoint
│   ├── tests/               # Backend pytest suite
│   ├── Dockerfile           # Backend container
│   ├── requirements.txt     # Python dependencies
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   ├── components/      # Sidebar, Composer, ChatArea, AuthPrompt
│   │   ├── hooks/           # useAuth, useVoice hooks
│   │   ├── lib/             # API client, Firebase client
│   │   └── types/           # TypeScript interfaces
│   ├── public/              # PWA manifest, service worker, icons
│   ├── package.json
│   └── .env.example
├── netlify.toml             # Frontend deployment config
└── README.md
```

## Getting Started

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --port 8000 --reload
```

Run tests:

```bash
PYTHONPATH=. pytest tests -v
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Build for production:

```bash
npm run build
```