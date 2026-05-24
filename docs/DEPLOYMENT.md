# Deployment Guide

## 1) MongoDB Atlas

- Create cluster and database user
- Add network access for backend platform IPs
- Copy connection URI to `MONGO_URI`

## 2) Backend (Render/Railway)

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm run start`
- Environment variables: use `server/.env.example`
- Ensure `CLIENT_URL` points to deployed frontend
- For Render, the repo also includes `render.yaml` with placeholder env wiring.

## 3) Frontend (Vercel)

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Env vars:
  - `VITE_API_BASE_URL=https://<your-backend-domain>/api`
  - `VITE_GOOGLE_CLIENT_ID=<id>`
- The client also includes `client/vercel.json` for SPA rewrites.

## 4) CI/CD

- GitHub Actions runs lint + build on push/PR (see `.github/workflows/ci.yml`)

## 5) Post-deploy checks

- Visit `/api/health`
- Sign up/login
- Upload resume and run analysis
- Validate charts and admin routes

## 6) Quick deploy checklist

1. Push this repo to GitHub.
2. Import the repo into Render using `render.yaml`.
3. Import `client/` into Vercel and set the frontend env vars.
4. Set the backend `CLIENT_URL` to the Vercel domain.
5. Re-run the smoke checks above.
