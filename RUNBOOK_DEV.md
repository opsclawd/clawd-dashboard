Applies to coding/dev sessions. Must comply with POLICY.

SPEC_FILE_REQUIRED: For each phase, create specs/PHASE-<n>.md before implementation.
START_SEMANTICS: START = execute the currently-approved spec to completion; then draft the next spec; then stop for approval.
EVENT_LOG_PATH: Use data/events.jsonl (append-only).
LOG_COMMIT_BLOCKS: After each commit block, append an event to data/events.jsonl using the existing event format already used by clawd-dashboard.
COMMIT_BLOCKS: Commit small cohesive blocks of related changes as soon as they are complete.
COMMIT_PER_FEATURE: For Phase 5, use 1 commit per feature/milestone (1.1, 1.2, 1.3, 2, 3...).
PHASE_5_FLOW: Merge Phase 5 spec to main, then implement Phase 5 on a feature branch, then open a PR for Gary review before merging.
OPTIONAL_PHASE_SCAN: OPTIONAL — periodically scan recent git commits + current/previous phase specs to orient work.
