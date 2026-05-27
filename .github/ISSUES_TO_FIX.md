Issue backlog — Smart Resume Analyzer & Job Matcher

This file lists known issues to triage, reproduce steps, and suggested fixes. Create GitHub Issues from these entries or use as a checklist.

1. Vercel preview: "Network Error" when signing up / CORS failures

- Symptom: Signup in Vercel preview shows "Network Error"; backend logs show missing/blocked origin or 401 on /api/auth endpoints.
- Reproduce: Open any Vercel preview URL, attempt signup. Check browser console + server logs.
- Suggested fix: Ensure server CORS allows \*.vercel.app and preview host; update `CLIENT_URL` or allowlist generation; ensure refresh cookie domain and secure flags are compatible with preview.

2. Production seed endpoint unavailable on Render (404)

- Symptom: POST /api/dev/seed-admin-protected returns 404 on deployed Render instance.
- Reproduce: POST with x-seed-secret header to deployed backend URL.
- Suggested fix: Set `SEED_SECRET` in Render env, redeploy so protected route is registered; alternatively use a one-time migration job.

3. Frontend not deployed / wrong public URL configured

- Symptom: Production checks hit backend URL instead of frontend; Razorpay verification requires public frontend link.
- Reproduce: Open project production URL and see backend JSON instead of site.
- Suggested fix: Deploy `client/` to Vercel (or any static host) and update DNS/links in README and Render env if necessary.

4. 401 / refresh-loop and unauthorized fetches (many GET /api/auth/me 401 in logs)

- Symptom: Server logs show repeated 401 and POST /api/auth/refresh 401; UI makes many refresh attempts.
- Reproduce: Open site when unauthenticated or after logout, inspect network calls to /api/auth/refresh and /api/auth/me.
- Suggested fix: Ensure refresh token cookie is set on login (httpOnly, sameSite settings) and that `auth` middleware reads cookie correctly; add retry/backoff in client refresh logic and handle 401 by stopping refresh attempts and redirecting to login.

5. Logout does not clear server-side httpOnly cookie reliably (partial/was fixed locally)

- Symptom: Users still show as logged out in UI but refresh endpoint returns 401 until manual logout; server needed explicit POST /auth/logout to clear cookie.
- Reproduce: Login, then click logout; check cookie and /api/auth/me.
- Suggested fix: Ensure client calls server logout endpoint on signout and server clears refresh cookie; verify domain/path flags.

6. Mobile drawer/menu UX issues

- Symptom: Mobile sidebar closed immediately or nav items missing for logged-in users on small screens.
- Reproduce: Resize to mobile viewport and open menu as logged-in user.
- Suggested fix: Adjust Sidebar.jsx and Navbar.jsx behavior to preserve open state and render auth links; tests added and pushed (verify visually).

7. Playwright E2E failures (ESM/CommonJS mismatch)

- Symptom: Playwright error "did not expect test() to be called here" or module resolution errors.
- Reproduce: Run `npx playwright test` before converting config to ESM.
- Suggested fix: Convert `playwright.config.js` to ESM, update imports, add JS fallback tests; ensure CI uses Node version compatible with ESM.

8. Razorpay website verification pending (needs public frontend)

- Symptom: Payment gateway requires a verified website link; verification cannot proceed without public frontend URL.
- Reproduce: Attempt merchant verification on Razorpay dashboard without public link.
- Suggested fix: Deploy frontend to Vercel and add the public URL to Razorpay; complete meta tag or DNS verification as required.

9. Misc: Large bundle warning on Vite build

- Symptom: Vite build warns about chunks > 500kB
- Reproduce: `npm run build --prefix client` and inspect output.
- Suggested fix: Code-split, lazy-load heavy libs, vendor chunking, optimize images.

Next steps

- Create GitHub Issues for each entry or confirm which ones to prioritize.
- I can open the issues on GitHub if you provide a personal access token with repo:issues scope, or you can create them manually from this file.

Contact me which option you prefer.
