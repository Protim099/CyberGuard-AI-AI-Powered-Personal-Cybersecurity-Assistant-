# CyberGuard AI — AI-Powered Personal Cybersecurity Assistant

A production-style full-stack starter for personal defensive cybersecurity:
- Next.js + TypeScript + Tailwind CSS frontend
- Express + TypeScript backend API
- PostgreSQL + Prisma database
- Python FastAPI AI/security service
- JWT authentication
- URL/email/file/password security modules
- Real-time security event stream with Socket.IO
- Professional dark cybersecurity SaaS UI

## Architecture

Browser → Next.js → Express API → PostgreSQL
                         ↘ Python FastAPI
                         ↘ Threat-intelligence providers
                         ↘ Socket.IO events

## Requirements
- Node.js 20+
- Python 3.11+
- PostgreSQL 15+
- npm

## Quick start

1. Copy environment files:
   `cp .env.example .env`
2. Install frontend:
   `cd frontend && npm install`
3. Install backend:
   `cd ../backend && npm install`
4. Install AI service:
   `cd ../ai-service && python -m venv .venv`
   Windows: `.venv\Scripts\activate`
   macOS/Linux: `source .venv/bin/activate`
   `pip install -r requirements.txt`
5. Create PostgreSQL database and update DATABASE_URL.
6. From backend:
   `npx prisma generate`
   `npx prisma migrate dev --name init`
7. Run backend: `npm run dev`
8. Run frontend: `npm run dev`
9. Run AI service: `uvicorn app.main:app --reload --port 8000`

The external threat APIs are optional. Without API keys, the application uses safe local heuristics and clearly marks the result as a local/demo analysis.

## Security notes
Never send or store raw passwords. Password analysis in this starter only evaluates strength locally and uses a SHA-256-derived prefix for optional breach lookup patterns. Add rate limiting, CSRF strategy, secure cookies, audit logging, secret management, and production TLS before deployment.

## v2 upgrade notes
- Frontend is now a multi-route Next.js app: landing, `/auth`, `/dashboard`, `/scan/[type]` (url, email, file), `/password`, `/assistant`, `/monitoring`, with a shared design system in `frontend/components/ui.tsx`.
- Start the database with `docker compose up -d`, then follow Quick start.
- New API routes: `GET /api/scans`, `GET /api/alerts`, `PATCH /api/alerts/:id/read`, `POST /api/assistant` (uses the AI service, falls back to local rules).
- Raw passwords are no longer persisted by `/api/scans`. Password checks run in the browser; breach lookup uses k-anonymity.
- Known gaps: JWT is kept in localStorage (move to httpOnly cookies for production), no 2FA backend yet, no Alerts/Reports/Settings pages yet.
