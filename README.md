# Smart Resume Analyzer — Development README

This repository contains the Smart Resume Analyzer full-stack MERN app (client and server). This README covers basic developer setup for the immediate sprint: persistent MongoDB, env config, and dev run commands.

Prerequisites

- Node.js (18+ recommended)
- npm
- MongoDB (local mongod) or a MongoDB Atlas cluster

1. Copy environment files

- The server example env is at `server/.env.example`. Copy it to `server/.env` and fill in the values.
  - Set `MONGO_URI` to your local MongoDB (e.g. `mongodb://localhost:27017/sra-dev`) or your Atlas connection string.

2. Install dependencies

```
# from the repo root
npm --prefix server install
npm --prefix client install
```

3. Run MongoDB (local)

- On Windows you can start the MongoDB service or run `mongod` from the MongoDB installation folder.

4. Start the server and client

```
# start the server in dev mode (nodemon)
npm --prefix server run dev

# start the client (Vite)
npm --prefix client run dev
```

5. Dev admin account

- During development the server may auto-seed a dev admin (admin@example.com / Admin@123) when no users exist. Check the server log on startup for a seed message.

Notes

- For production, use secure values for `JWT_SECRET` and `JWT_REFRESH_SECRET` and enable HTTPS + secure httpOnly cookies for refresh tokens.
- Keep provider API keys (RapidAPI, Adzuna) secret; add them to `server/.env` when using live job providers.

If you want, I can open a PR that adds `server/.env` to .gitignore (recommended) and apply the refresh-token implementation next.

# Smart Resume Analyzer & Job Matcher (MERN)

Production-ready AI SaaS web app that analyzes resumes against job descriptions, computes ATS scores, detects skill gaps, and generates actionable recommendations.

## Tech Stack

- Frontend: React + Vite + Tailwind CSS + Framer Motion + Recharts + React Hook Form
- Backend: Node.js + Express + Mongoose + JWT + Google OAuth endpoint support
- AI/NLP: OpenAI abstraction + heuristic fallback
- Storage: MongoDB Atlas
- Upload/Parsing: Multer + pdf-parse + mammoth

## Project Structure

- `client/` - React frontend
- `server/` - Express backend (MVC)
- `docs/` - API and deployment docs
- `.github/workflows/ci.yml` - CI pipeline

## Quick Start

1. Copy env examples:
   - `server/.env.example` -> `server/.env`
   - `client/.env.example` -> `client/.env`
2. Install dependencies:
   - root: `npm install`
   - client: `npm install --prefix client`
   - server: `npm install --prefix server`
3. Run full stack:
   - `npm run dev`
4. Open app:
   - frontend: `http://localhost:5173`
   - backend health: `http://localhost:5000/api/health`

## Core Features Implemented

- JWT signup/login + Google login endpoint
- Forgot/reset password API flow
- Resume upload (PDF/DOCX), parsing, extraction
- Job description matching, skill-gap analysis
- ATS scoring engine (format + keyword + technical)
- AI suggestion + cover letter + interview prep generation
- Dashboard analytics with charts
- Resume history, profile, settings, admin panel
- Security: Helmet, CORS, rate limiting, validation, upload restrictions
- Performance: route-based code splitting, lazy loading, pagination-ready APIs

## Deployment

- Frontend: Vercel
- Backend: Render/Railway
- MongoDB: Atlas

See `docs/DEPLOYMENT.md` for full setup.

## Notes

- Google OAuth frontend button wiring can be integrated using Google Identity SDK with the provided backend endpoint `/api/auth/google`.
- AI provider defaults to `heuristic` when no external key is configured.
