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

Or via API:
```bash
curl -X POST http://127.0.0.1:5174/api/v1/events \
  -H 'content-type: application/json' \
  -d '{"ts":"2026-01-30T00:00:00.000Z","stream":"job-search","type":"plan","summary":"Test event"}'
```

## Streams
- `streams/cannabis-on/`
- `streams/job-search/`
- `streams/marketing/`

## Notes
- `data/events.jsonl` is the append-only source of truth.
- API endpoint supports filters: `?stream=...&type=...&status=...`.
