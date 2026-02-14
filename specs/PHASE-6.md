# Phase 6 Spec — Dashboard Deployment + CI/CD

**Owner:** Gary  
**Repo:** https://github.com/opsclawd/clawd-dashboard  
**Date:** 2026-01-31  
**Scope:** Deploy the dashboard so it can be reached remotely (mobile-ready) and build a CI/CD pipeline that tests, builds, and publishes the API + UI automatically.

---

## 0) Objectives

1. **Full-stack deployment:** Host the API and static UI so the dashboard is accessible from anywhere on HTTPS.
2. **Edge preview:** Use Vercel deploy previews for the UI so every PR has a testable URL before merging.
3. **Automated delivery:** Connect GitHub Actions to run the gate suite (typecheck + tests + web build + verify-log) and push the artifacts to Fly.io (API) and Vercel (web) on success.
4. **Traceable release:** Keep audit/history log (existing `data/events.jsonl`) in sync with deployments and log when a deploy succeeds/fails.

Non-goals: multi-region multi-repo clusters, production-grade auto-scaling.

---

## 1) Deployment Milestones

### 1.1 Fly.io Service for API + optional static
- Prepare a Fly io app (or apps) that can run the API (Node server) and optionally serve the static assets (if we don’t split to Vercel).  
- Document required env vars (API_PORT, FLY_REGION, OPENAI env keys, etc.) and any secrets (Fly secrets).  
- Acceptance: `fly deploy` (or GitHub Actions) yields a reachable HTTPS endpoint running the API + returning the UI when hitting `/`.

### 1.2 Vercel for Static UI Previews & Production
- Configure Vercel project for the `@clawd/web` workspace output (Vite `dist/`).  
- Ensure PR deploy previews are enabled (auto builds per branch) and production deploy hits `master`.  
- Acceptance: every PR in GitHub produces a Vercel preview URL, and the `production` URL serves the latest `dist/`.

### 1.3 GitHub Actions CI/CD
- Single workflow triggered on pushes to `master`/PRs that runs:  `npm install`, `npm run typecheck`, `npm test`, `npm run build`, `npm run verify:log`.  
- On success: build & push `@clawd/api` Docker (Fly) & `@clawd/web` dist (Vercel). Use Fly CLI for deploying the API (`fly deploy --remote-only` with GHCR image) and Vercel CLI (or Vercel Git integration) for the static site.  
- On failure: fail the workflow, post logs (GH Actions logs).  
- Acceptance: workflow completes green, and Fly/Vercel receive new builds automatically.

### 1.4 Observability & Health
- Use Fly metrics/logs + Vercel dashboards to confirm services are healthy; optionally trigger `npm run verify:log` post-deploy.  
- Provide README instructions for how to re-deploy manually (`fly deploy`, `vercel --prod`).  
- Acceptance: we can hit `/health` or `/api/v1/health` and get `200`, and the logs reflect the deploy timestamps.

---

## 2) Questions & Decisions

- Should Fly also host the UI (with a CDN) after the first preview cycle, or keep the split (Fly API + Vercel UI) permanently? **Decision:** keep the split permanently so the UI benefits from Vercel’s CDN + preview URLs while the API runs on Fly.
- Which secrets (OpenAI key, Fly/Vercel tokens) should be injected into GitHub Actions vs the platform dashboards? **Decision:** store credentials in the platform dashboards (Fly secrets, Vercel env vars) and surface only the deploy tokens (Fly API token, Vercel token, OpenAI API key) as GitHub Secrets for the workflow.
- Do we want to guard deployments with a manual approval step (for example, `workflow_dispatch` for production) or deploy automatically on every `master` push? **Decision:** keep deployments automatic on every `master` push to ensure `master` always lines up with the live services.

---

## 3) Deliverables

- `Fly.toml` (or equivalent) describing the app, env vars, and postgres/memory settings if needed.  
- `vercel.json` or config snippet showing the static build command (`npm run build -w @clawd/web`).  
- GitHub Actions workflow (e.g., `.github/workflows/ci.yml`) that covers tests + builds + deploys + log verification.  
- README section describing `npm run verify:log`, `fly status`, Vercel environment setup, and how to access previews.

---

## 4) Phase 6 Acceptance Criteria

1. Deploys are reproducible: running the GitHub Actions workflow on `master` triggers tests/builds and updates Fly (API) and Vercel (UI).  
2. The remote host exposes the dashboard UI + API endpoints over HTTPS with consistent CORS/config.  
3. Every PR has a Vercel preview URL; hitting that URL shows the dashboard UI (with correct env config pointing to the Fly API).  
4. Audit logs capture the phase completion and deployment events (existing `scripts/log-event` + `data/events.jsonl`).  
5. Documentation exists for manual redeployment and for how to inspect logs/metrics on Fly + Vercel.
