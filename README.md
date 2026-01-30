# Clawd Dashboard (MVP)

Local-first audit dashboard for Clawd tasks across streams.

## Dev (local)
```bash
npm install
npm run dev:api   # http://127.0.0.1:5174
npm run dev:web   # http://localhost:5173
```

## Log an event (MVP)
```bash
node scripts/log-event.mjs job-search plan "Drafted job search dashboard plan"
```

The script now adds audit metadata (`id`, `correlationId`, `actor`, `severity`) and accepts an optional severity override (`info`, `warn`, or `error`).

Or via API:
```bash
curl -X POST http://127.0.0.1:5174/api/v1/events \
  -H 'content-type: application/json' \
  -d '{"ts":"2026-01-30T00:00:00.000Z","stream":"job-search","type":"plan","summary":"Test event","severity":"warn"}'
```

## Audit logging wrapper
Run commands through the audit wrapper so every flow emits a start/finish pair with the same `correlationId` and the exit status captured as `severity` (`info` for success, `error` for non-zero exits).

```bash
node scripts/run.mjs dashboard "git status"
```

The wrapper writes `terminal.log`, appends events to `data/events.jsonl`, and the API surfaces those entries (with `actor` defaulting to `clawd`) so the dashboard can trace what happened.

## Git review API
The backend exposes read-only Git data for the UI (and your own scripts):

- `GET /api/v1/git/commits?limit=20` — recent commits with sha, author, date, and message.
- `GET /api/v1/git/commit/:sha` — commit detail plus the changed files.
- `GET /api/v1/git/diff/:sha?path=relative/path` — unified diff for a commit or a single file within that commit.

Example:
```bash
curl http://127.0.0.1:5174/api/v1/git/commits?limit=5
curl http://127.0.0.1:5174/api/v1/git/commit/$(git rev-parse HEAD)
curl http://127.0.0.1:5174/api/v1/git/diff/$(git rev-parse HEAD)?path=README.md
```

## Streams
- `streams/cannabis-on/`
- `streams/job-search/`
- `streams/marketing/`

## Notes
- `data/events.jsonl` is the append-only source of truth.
- API endpoint supports filters: `?stream=...&type=...&status=...`.
