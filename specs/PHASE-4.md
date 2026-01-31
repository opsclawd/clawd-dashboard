# Phase 4 Spec — Clawd Dashboard (Operational UX + Reporting)

**Owner:** Gary  
**Repo:** https://github.com/opsclawd/clawd-dashboard  
**Date:** 2026-01-30  
**Scope:** Make daily usage frictionless: CRUD in stream modules, reporting/exports, digest management UI, and index status.

---

## 0) Goals

1. **Operational UX polish:** fully manage stream items in UI (create/edit/delete).
2. **Reporting:** one‑click reports for each stream (CSV + Markdown summaries).
3. **Digest delivery:** manage subscriptions and “send now” from UI.
4. **Task/event connections:** link stream items to tasks/events for traceability.
5. **Index QA:** show index status and detect lag or mismatch.

Non‑goals:
- Multi‑user roles
- Public cloud deployment

---

## 1) Stream Module CRUD

### 1.1 Cannabis Checklist
- Add edit/delete controls
- Support notes field

### 1.2 Job Applications
- Add edit/delete controls
- Track status + follow‑up date + resume version

### 1.3 Marketing Campaigns
- Add edit/delete controls
- Track hypothesis/metric/result

Acceptance criteria:
- CRUD for each stream in UI; persisted via API.

---

## 2) Reporting + Exports

- Add **Markdown summary** endpoints for:
  - Cannabis checklist report
  - Job search status report
  - Marketing experiment summary
- UI buttons for Markdown/CSV exports

Acceptance criteria:
- Each stream has CSV + Markdown export.

---

## 3) Digest Delivery UI

- UI for digest subscriptions (list/add/disable/delete)
- “Send now” action (server endpoint or cron trigger)

Acceptance criteria:
- Configure digest recipients from UI.
- Trigger immediate digest send.

---

## 4) Task/Event Links

- Allow stream items to link to related tasks/events
- Show related activity in details view

Acceptance criteria:
- At least one stream module shows linked tasks/events.

---

## 5) Index QA + Status

- Show indexed status in UI:
  - last indexed timestamp
  - lag between JSONL and SQLite
- Warn when indexed count mismatches JSONL

Acceptance criteria:
- UI clearly indicates index health.

---

## 6) Milestones

**4.1** CRUD for stream modules  
**4.2** Reports/exports (Markdown + CSV)  
**4.3** Digest subscriptions UI + send‑now  
**4.4** Task/event links  
**4.5** Index status/QA

---

## 7) Open Questions

1. Where should “send now” deliver by default (email vs Telegram)?
2. Should reports be saved as artifacts (streams/<name>/reports/)?
3. How strict should index mismatch warnings be?
