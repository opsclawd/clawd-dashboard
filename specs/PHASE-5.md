# Phase 5 Spec — Clawd Dashboard (Stream Planning Views + Daily Ops)

**Owner:** Gary  
**Repo:** https://github.com/opsclawd/clawd-dashboard  
**Date:** 2026-01-31  
**Scope:** Make the dashboard a daily planning cockpit for the three streams (cannabis, job search, marketing), with lightweight ops awareness and traceability.

---

## 0) Objectives

1. **Stream planning first:** each stream has a “what should I do next?” view that supports daily planning.
2. **Operational awareness:** quick visibility into what’s in progress, what’s next, and what happened today.
3. **Traceability:** actions/events can be connected back to tasks and stream items (minimal viable linking).

Non-goals:
- Multi-user auth/roles
- Full automation pipelines / delivery orchestration
- Complex analytics

---

## 1) Stream Planning Views (Priority)

### 1.1 Job Search — Follow-up Queue

Add a dedicated planning section (within the Job Search stream module) that highlights:
- **Overdue follow-ups** (followUpDate < today)
- **Due soon** (followUpDate within next 7 days)
- **No follow-up date** (optional bucket)

UX:
- Sort buckets by date ascending.
- Quick actions:
  - set/update follow-up date
  - change status
  - (optional) link to a task

Acceptance criteria:
- Job applications can be filtered by follow-up urgency.
- Follow-up queue updates immediately after edits.


### 1.2 Cannabis — Active Checklist View

Add an “Active” view emphasizing today’s work:
- Show **todo + in_progress** items by default.
- Toggle to include done.
- Quick actions: mark done / mark in progress.

Acceptance criteria:
- Cannabis checklist view supports day planning without scrolling past completed items.


### 1.3 Marketing — Experiment Pipeline / Next Actions

Add a planning view for campaigns:
- Focus on **draft** and **published** campaigns.
- “Needs measurement” bucket:
  - published with missing result OR missing metric
- Optional lightweight tags for “next step” (e.g. "design", "ship", "measure") as a string field.

Acceptance criteria:
- Marketing planning view highlights campaigns that need action (draft/published/needs measurement).

---

## 2) Daily Ops Cockpit (Secondary)

Add a top-level “Today” section that summarizes:
- **Tasks:** Next / In Progress / Blocked (compact list)
- **Recent events:** last N events (already available) with the active filters resettable
- **Health:** log integrity + index status summary (already available) surfaced prominently

Acceptance criteria:
- Dashboard landing provides an at-a-glance view of what’s happening today.

---

## 3) Minimal Traceability (Tertiary)

### 3.1 Link stream items to tasks (expand beyond job search)

- Cannabis checklist items: optional `taskId`
- Marketing campaigns: optional `taskId`

Acceptance criteria:
- At least one additional stream (beyond job apps) can link to a task.


### 3.2 (Optional) Link events to tasks

- Allow event creation UI (or event detail editing) to attach a `taskId`.
- Show linked task in event drawer.

Acceptance criteria:
- You can connect an event to a task and navigate between them.

---

## 4) Milestones

**5.1** Job Search follow-up queue (overdue/due soon)  
**5.2** Cannabis active checklist planning view  
**5.3** Marketing next-actions pipeline view  
**5.4** Today cockpit (tasks + recent events + health summary)  
**5.5** Expand task linking to other streams (and optional event↔task link)

---

## 5) Open Questions

1. What is “today” for follow-up comparisons: local timezone midnight or rolling 24h?
2. Follow-up “due soon” window: 7 days or configurable?
3. Do we want “archive” semantics for completed items, or just filters?
4. Should stream planning views live on the main dashboard, or inside each stream panel only?
