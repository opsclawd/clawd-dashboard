# Phase 2 Spec — Clawd Dashboard (Audit-Ready)

**Owner:** Gary  
**Repo:** https://github.com/opsclawd/clawd-dashboard  
**Date:** 2026-01-30  
**Scope:** Upgrade MVP into an audit-ready local-first dashboard with reliable event capture, traceability, and review tools.

---

## 0) Goals

1. **Auditability:** Gary can see *what happened*, *when*, *why*, and *what changed* (files/commits).
2. **Reliability:** Major actions are logged automatically (not dependent on manual logging).
3. **Teachability:** Changes are reviewable via diffs and structured specs, with frequent commits.
4. **Scalability (local-first):** Event stream supports pagination, filtering, and eventually full-text search.
5. **Streams:** Distinguish work across:
   - `dashboard` (meta-work on the dashboard itself)
   - `cannabis-on`
   - `job-search`
   - `marketing`

Non-goals (this phase):
- Cloud deployment
- Multi-user auth
- Real-time collaboration

---

## 1) Current State (MVP)

- Vite+React UI at `http://localhost:5173`
- Fastify API at `http://127.0.0.1:5174`
- Append-only storage: `data/events.jsonl`, `data/tasks.jsonl`
- Features:
  - Event stream + filters + pagination (limit/offset)
  - Tasks board (create tasks)
  - Artifacts list
  - Clean Architecture split in API

---

## 2) Requirements

### 2.1 Event Capture (Automatic)
**Problem:** today, events are mostly manual.

**Requirement:** Any “major action” must emit an event.

Major action examples:
- running a command that changes the system or repo state
- starting/stopping dev servers
- installing packages
- commits/pushes
- spawning sub-agents / research bursts
- changes to requirements/specs

**Implementation options (choose one for this phase):**

**Option A (recommended, incremental):**
- Introduce a `scripts/run.mjs` wrapper:
  - logs an event (stream, type=command, summary)
  - executes the command
  - captures stdout/stderr to `terminal.log`
  - logs completion event (success/fail, exit code)
- Policy: all terminal commands go through this wrapper.

**Option B (integrated):**
- Add a lightweight “command journal” module inside the API that accepts `/api/v1/journal/command` POSTs from a wrapper.

Acceptance criteria:
- Running one wrapper command results in ≥2 events (start + finish) and includes exit status.

---

### 2.2 Event Model Improvements
Add these fields to event schema (domain):
- `id` (uuid)
- `correlationId` (uuid) — used to group events for a single action flow (e.g., “fix CORS”) across multiple steps
- `actor` (string, default: `clawd`)
- `severity` (`info|warn|error`)

Acceptance criteria:
- API accepts these fields and returns them.
- UI displays correlation grouping (at minimum: show correlationId in details view).

---

### 2.3 Git Review Tools
**Goal:** Review code changes without leaving the dashboard.

Features:
1) **Recent commits panel**
- List last N commits, show message, author, time.

2) **Diff viewer**
- Click a commit → list changed files
- Click file → show unified diff

Implementation approach:
- Backend infrastructure adapter uses `git` CLI:
  - `git log -n 20 --pretty=...`
  - `git show --name-only <sha>`
  - `git show <sha> -- <file>`
- Expose read-only endpoints:
  - `GET /api/v1/git/commits?limit=20`
  - `GET /api/v1/git/commit/:sha`
  - `GET /api/v1/git/diff/:sha?path=...`

Acceptance criteria:
- Gary can review diffs for Phase 2 commits from within UI.

---

### 2.4 Tasks: Status Transitions
Current: tasks are created but not movable.

Add:
- `PATCH /api/v1/tasks/:id` to update status
- UI: buttons or drag/drop (phase 2A = buttons; phase 2B = drag/drop)

Acceptance criteria:
- Task can move backlog→next→in_progress→done and blocked.
- Each move produces an event (type=`task`).

---

### 2.5 Artifacts: Provenance
Add:
- artifact entries can reference:
  - file path
  - related commit
  - related task/event

Acceptance criteria:
- At least one provenance field is shown in UI for artifacts.

---

### 2.6 Search & Saved Filters (Lightweight)
- UI-only search currently filters summaries in-memory.
- Add API param `q` for server-side filtering (simple contains match across summary/type/stream).
- Add “saved filters” stored locally in a JSON file (`data/saved-filters.json`).

Acceptance criteria:
- Create/save a filter in UI and recall it.

---

## 3) Milestones

### Milestone 2.1 — Audit Logging Foundations
- add `Event.id`, `correlationId`, `severity`, `actor`
- add `scripts/run.mjs` wrapper
- enforce wrapper usage for “major” commands

### Milestone 2.2 — Git Review Panel
- backend git endpoints
- UI panel for commits + diff viewer

### Milestone 2.3 — Task Transitions + Events
- patch endpoint
- UI transitions
- auto event on transition

### Milestone 2.4 — Saved Filters + Simple Search
- `q` param
- save/restore filter presets

---

## 4) Implementation Notes (Architecture)

- **Domain**: types + invariants only (no git/fs)
- **Application**: use-cases/services; emits domain events and returns DTOs
- **Infrastructure**: JSONL repos, git adapter, terminal log reader
- **Interface**: Fastify routes map IO → application
- **Bootstrap**: wiring

Redaction policy:
- never store secrets (passwords, tokens, OTPs)
- redact emails/phones from summaries where appropriate

---

## 5) Rollout / Demo Checklist

- [ ] Event stream shows correlation groups
- [ ] Terminal wrapper logs start+finish events
- [ ] Git panel shows last commits and file diffs
- [ ] Task status transitions work and create events
- [ ] Pagination + filters stable with growing dataset

---

## 6) Open Questions

1) Should we treat `terminal.log` as an artifact (with links from events)?
2) Do we want immutable audit (signed hash chain) later?
3) Should we store the JSONL as canonical and generate SQLite index (Phase 3)?
