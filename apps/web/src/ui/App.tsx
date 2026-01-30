import React, { useEffect, useState } from 'react';

type EventItem = {
  ts: string;
  stream: string;
  type: string;
  summary: string;
  status?: string;
};

type TaskItem = {
  id: string;
  ts: string;
  stream: string;
  title: string;
  status: 'backlog' | 'next' | 'in_progress' | 'blocked' | 'done';
};

const columns: TaskItem['status'][] = [
  'backlog',
  'next',
  'in_progress',
  'blocked',
  'done'
];

export function App() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStream, setNewTaskStream] = useState('job-search');

  useEffect(() => {
    const params = new URLSearchParams();
    if (stream) params.set('stream', stream);
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    const url = `http://127.0.0.1:5174/api/v1/events${params.toString() ? `?${params}` : ''}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .catch((e) => setError(String(e)));
  }, [stream, type, status]);

  useEffect(() => {
    fetch('http://127.0.0.1:5174/api/v1/tasks')
      .then((r) => r.json())
      .then((data) => setTasks(data.items ?? []))
      .catch((e) => setError(String(e)));
  }, []);

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    const payload: TaskItem = {
      id: crypto.randomUUID(),
      ts: new Date().toISOString(),
      stream: newTaskStream,
      title: newTaskTitle.trim(),
      status: 'backlog'
    };
    await fetch('http://127.0.0.1:5174/api/v1/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setTasks((prev) => [payload, ...prev]);
    setNewTaskTitle('');
  };

  return (
    <div style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Clawd Dashboard</h1>
      <p style={{ marginTop: 0, color: '#555' }}>Local MVP — audit log viewer</p>

      {error && (
        <pre style={{ background: '#fee', padding: 12, borderRadius: 8 }}>
          {error}
        </pre>
      )}

      <section style={{ marginBottom: 24 }}>
        <h2>Tasks</h2>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            placeholder="New task"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
          />
          <select value={newTaskStream} onChange={(e) => setNewTaskStream(e.target.value)}>
            <option value="cannabis-on">Cannabis (ON)</option>
            <option value="job-search">Job Search</option>
            <option value="marketing">Marketing</option>
          </select>
          <button onClick={addTask}>Add task</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {columns.map((col) => (
            <div key={col} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 8 }}>
              <strong>{col}</strong>
              <ul>
                {tasks.filter((t) => t.status === col).map((t) => (
                  <li key={t.id}>
                    [{t.stream}] {t.title}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <label>
            Stream
            <select value={stream} onChange={(e) => setStream(e.target.value)}>
              <option value="">All</option>
              <option value="cannabis-on">Cannabis (ON)</option>
              <option value="job-search">Job Search</option>
              <option value="marketing">Marketing</option>
            </select>
          </label>
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All</option>
              <option value="research">research</option>
              <option value="plan">plan</option>
              <option value="file_write">file_write</option>
              <option value="file_edit">file_edit</option>
              <option value="command">command</option>
              <option value="browser">browser</option>
              <option value="message">message</option>
              <option value="decision">decision</option>
              <option value="reminder">reminder</option>
              <option value="task">task</option>
            </select>
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="planned">planned</option>
              <option value="in_progress">in_progress</option>
              <option value="done">done</option>
              <option value="blocked">blocked</option>
            </select>
          </label>
        </div>

        <h2>Recent events</h2>
        {items.length === 0 ? (
          <p>No events yet.</p>
        ) : (
          <ul>
            {items.map((ev, idx) => (
              <li key={idx}>
                <strong>{ev.stream}</strong> · {ev.type}
                {ev.status ? ` · ${ev.status}` : ''} · {ev.summary}{' '}
                <span style={{ color: '#777' }}>({ev.ts})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <hr />
      <p style={{ color: '#777' }}>
        Next: artifacts list, git diffs.
      </p>
    </div>
  );
}
