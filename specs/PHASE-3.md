# Phase 3 Spec — Clawd Dashboard (Operational + Scalable)

**Owner:** Gary  
**Repo:** https://github.com/opsclawd/clawd-dashboard  
**Date:** 2026-01-30  
**Scope:** Move from “audit-ready MVP” to an operational system: indexed data, integrity guarantees, stream modules, and automation.

---

## 0) Goals

1. **Performance at scale:** handle tens/hundreds of thousands of events without UI lag.
2. **Stronger audit guarantees:** detect tampering and produce digestible audit reports.
3. **Operational workflows:** first-class support for the three business streams.
4. **Automation:** recurring summaries, reminders, and checklists.
5. **Access:** optional LAN web access with basic auth.

Non-goals (Phase 3):
- Multi-tenant SaaS
- Public cloud production deployment (unless explicitly requested)

---

## 1) Data Layer Upgrade (JSONL + SQLite Index)

### 1.1 Canonical log remains JSONL
- `data/events.jsonl` stays the source of truth.
- `data/tasks.jsonl` stays append-only (or becomes task-event log + materialized view).

### 1.2 Add SQLite index
- Add `data/index.sqlite` (ignored by git).
- Schema tables (initial):
  - `events(id, ts, stream, type, severity, actor, correlation_id, summary, status, json)`
  - `tasks(id, ts, stream, status, title, json)`
  - `git_commits(sha, author, ts, message, json)` (optional cached)

### 1.3 Ingestion pipeline
- Create `scripts/indexer.mjs`:
  - reads JSONL
  - upserts into SQLite
  - maintains `last_ingested_offset` (byte offset) for incremental runs
- Add API endpoints:
  - `POST /api/v1/index/rebuild` (admin/local)
  - `POST /api/v1/index/tick` (incremental)

Acceptance criteria:
- Event list is served from SQLite when enabled.
- Full-text search is fast (<200ms for typical queries on 100k events).

---

## 2) Event Integrity (Hash Chain)

### 2.1 Hash chaining
Each event includes:
- `prevHash`
- `hash`

Hash computation:
- `hash = sha256(prevHash + canonical_json(event_without_hash_fields))`

### 2.2 Verification tool
- `scripts/verify-log.mjs` verifies the chain and reports first failure.

Acceptance criteria:
- If a single historical event line is edited, verification fails deterministically.

---

## 3) Stream Modules

### 3.1 Cannabis (Ontario) module
Features:
- Licensing checklist (milestones + artifacts required)
- Document vault map (SOPs, site/security plans, municipal docs)
- Decision log: structured decisions with rationale

Data:
- `streams/cannabis-on/` stores docs (markdown + uploads)

Acceptance criteria:
- A checklist can be tracked in tasks/events and exported as a report.

### 3.2 Job search module
Features:
- Applications tracker (company, role, link, status, follow-up date)
- Resume versions mapped to applications
- Reminders for follow-ups

Data:
- `streams/job-search/applications.json` (or SQLite table)

Acceptance criteria:
- Track at least 20 applications with status and next action.

### 3.3 Marketing module
Features:
- Campaign tracker (idea → draft → publish → measure)
- Content calendar
- Experiment log (hypothesis, change, metric, result)

Acceptance criteria:
- Record campaigns and view by time window.

---

## 4) Automation

### 4.1 Daily/weekly digests
- Scheduled summary of:
  - events by stream
  - tasks moved to done
  - upcoming follow-ups

### 4.2 Reminders
- Simple reminder creation that writes tasks/events and schedules cron.

Acceptance criteria:
- Gary can opt-in to a daily digest email or Telegram message.

---

## 5) Access (LAN Hosting)

- Add API config `HOST=0.0.0.0` + basic auth token.
- Optionally serve the web UI from the same backend.

Acceptance criteria:
- Dashboard accessible from a phone on the same network.

---

## 6) Milestones

### Milestone 3.1 — SQLite Index
- schema + indexer + API read path

### Milestone 3.2 — Integrity
- hash chain + verify script + UI indicator

### Milestone 3.3 — Stream Modules
- cannabis checklist + job applications tracker + marketing campaign tracker

### Milestone 3.4 — Automation
- digests + reminders

### Milestone 3.5 — LAN Access
- basic auth + host binding + optional static serve

---

## 7) Open Questions

1) Should tasks become event-sourced (task events) with a materialized view?
2) For integrity: do we want daily signed digests (GPG) or just hash chain?
3) For LAN hosting: do you want TLS internally or plain HTTP + auth?
