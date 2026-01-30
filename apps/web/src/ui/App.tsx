import React, { useEffect, useState } from 'react';

type EventItem = {
  ts: string;
  stream: string;
  type: string;
  summary: string;
};

export function App() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:5174/api/v1/events')
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Clawd Dashboard</h1>
      <p style={{ marginTop: 0, color: '#555' }}>Local MVP — audit log viewer</p>

      {error && (
        <pre style={{ background: '#fee', padding: 12, borderRadius: 8 }}>
          {error}
        </pre>
      )}

      <h2>Recent events</h2>
      {items.length === 0 ? (
        <p>No events yet.</p>
      ) : (
        <ul>
          {items.map((ev, idx) => (
            <li key={idx}>
              <strong>{ev.stream}</strong> · {ev.type} · {ev.summary}{' '}
              <span style={{ color: '#777' }}>({ev.ts})</span>
            </li>
          ))}
        </ul>
      )}

      <hr />
      <p style={{ color: '#777' }}>
        Next: timeline filtering, tasks board, artifacts list, git diffs.
      </p>
    </div>
  );
}
