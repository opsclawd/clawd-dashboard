# MEMORY.md

- Gary wants all actions to be auditable: always log resume/job-search updates in the job-search events stream.
- Gary wants a 24h autonomous dashboard workflow: work in staged, auditable chunks with cron + sub-agents; small incremental commits; no dependency bumps or schema-breaking changes without approval; no sweeping refactors without a checkpoint; no destructive system changes or external account actions without approval; produce daily report (summary, commits, risks/decisions, next tasks, optional screenshots) and pause for a morning approval gate before continuing.
- 24h autonomy policy: if Gary says “START,” continue executing the **currently-approved phase/spec** to completion with frequent commits/tests/browser checks/audit logs. When a phase completes, draft the **next phase spec** (milestones + acceptance criteria), present it for approval/amendments, then proceed once approved. This cadence repeats indefinitely (phase → implement → next spec → approval gate → implement).
- Audit/commit discipline: commit “blocks” of related items when they’re done (small, cohesive commits) and log each block to the events log so work is auditable.
