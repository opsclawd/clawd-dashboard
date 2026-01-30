import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

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

type ArtifactItem = {
  path: string;
  mtimeMs: number;
  kind: string;
};

const columns: TaskItem['status'][] = ['backlog', 'next', 'in_progress', 'blocked', 'done'];

const statusLabels: Record<TaskItem['status'], string> = {
  backlog: 'Backlog',
  next: 'Next',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done'
};

const statusAccent: Record<TaskItem['status'], string> = {
  backlog: '#c2c7da',
  next: '#84a9ff',
  in_progress: '#ffd966',
  blocked: '#ffb5b5',
  done: '#a3e635'
};

const streamOptions = [
  { value: 'cannabis-on', label: 'Cannabis (ON)' },
  { value: 'job-search', label: 'Job Search' },
  { value: 'marketing', label: 'Marketing' }
];

const eventTypeOptions = [
  'research',
  'plan',
  'file_write',
  'file_edit',
  'command',
  'browser',
  'message',
  'decision',
  'reminder',
  'task'
];

const eventStatusOptions = ['planned', 'in_progress', 'done', 'blocked'];

const formatTimestamp = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function App() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [eventStream, setEventStream] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventStatus, setEventStatus] = useState('');
  const [eventSearch, setEventSearch] = useState('');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStream, setNewTaskStream] = useState('job-search');

  useEffect(() => {
    const params = new URLSearchParams();
    if (eventStream) params.set('stream', eventStream);
    if (eventType) params.set('type', eventType);
    if (eventStatus) params.set('status', eventStatus);
    const url = `http://127.0.0.1:5174/api/v1/events${params.toString() ? `?${params}` : ''}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items ?? []);
        setError(null);
      })
      .catch((e) => setError(String(e)));
  }, [eventStream, eventType, eventStatus]);

  useEffect(() => {
    fetch('http://127.0.0.1:5174/api/v1/tasks')
      .then((r) => r.json())
      .then((data) => {
        setTasks(data.items ?? []);
        setError(null);
      })
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    fetch('http://127.0.0.1:5174/api/v1/artifacts')
      .then((r) => r.json())
      .then((data) => {
        setArtifacts(data.items ?? []);
        setError(null);
      })
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

  const tasksByStatus = useMemo(() => {
    const mapped = columns.reduce((acc, status) => {
      acc[status] = [];
      return acc;
    }, {} as Record<TaskItem['status'], TaskItem[]>);
    tasks.forEach((task) => {
      mapped[task.status].push(task);
    });
    return mapped;
  }, [tasks]);

  const filteredEvents = useMemo(() => {
    const query = eventSearch.trim().toLowerCase();
    if (!query) {
      return items;
    }
    return items.filter((ev) => ev.summary.toLowerCase().includes(query));
  }, [items, eventSearch]);

  return (
    <div className="app-shell">
      <div className="app-inner">
        <header className="app-header">
          <div>
            <p className="eyebrow">Delivery cockpit</p>
            <h1>Clawd dashboard</h1>
            <p className="app-tagline">Audit log observer, task board, and artifact trail.</p>
          </div>
          <div className="header-meta">
            <span className="meta-pill">Local MVP</span>
            <span className="meta-caption">Updated just now</span>
          </div>
        </header>

        {error && <div className="error-card">{error}</div>}

        <main className="panels-grid">
          <section className="panel tasks-panel">
            <div className="panel-header">
              <div>
                <h2>Tasks board</h2>
                <p className="panel-subtitle">Sort tasks into statuses and keep the backlog flowing.</p>
              </div>
              <span className="panel-count">{tasks.length} total</span>
            </div>

            <div className="task-controls">
              <div className="input-compact">
                <label className="input-label" htmlFor="new-task-title">
                  New task
                </label>
                <input
                  id="new-task-title"
                  value={newTaskTitle}
                  onChange={(event) => setNewTaskTitle(event.target.value)}
                  placeholder="Describe the next action"
                />
              </div>
              <label className="input-compact">
                <span className="input-label">Stream</span>
                <select value={newTaskStream} onChange={(event) => setNewTaskStream(event.target.value)}>
                  {streamOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="primary" onClick={addTask}>
                Add task
              </button>
            </div>

            <div className="tasks-board">
              {columns.map((column) => (
                <div className="column-panel" key={column}>
                  <div className="column-header" style={{ borderTopColor: statusAccent[column] }}>
                    <div>
                      <strong>{statusLabels[column]}</strong>
                      <p className="column-count">{tasksByStatus[column].length} items</p>
                    </div>
                    <span className="status-badge" style={{ backgroundColor: statusAccent[column] }} />
                  </div>
                  <div className="column-body">
                    {tasksByStatus[column].length === 0 ? (
                      <p className="empty-state">No tasks yet.</p>
                    ) : (
                      <ul className="task-list">
                        {tasksByStatus[column].map((task) => (
                          <li key={task.id} className="task-card">
                            <div className="task-title">{task.title}</div>
                            <div className="task-meta">
                              <span className="task-stream">[{task.stream}]</span>
                              <span className="task-time">{formatTimestamp(task.ts)}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel events-panel">
            <div className="panel-header">
              <div>
                <h2>Recent events</h2>
                <p className="panel-subtitle">Audit log entries streamed from Clawd.</p>
              </div>
              <span className="panel-count">{filteredEvents.length} matches</span>
            </div>

            <div className="filters-row">
              <label>
                <span className="input-label">Stream</span>
                <select value={eventStream} onChange={(event) => setEventStream(event.target.value)}>
                  <option value="">All</option>
                  {streamOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="input-label">Type</span>
                <select value={eventType} onChange={(event) => setEventType(event.target.value)}>
                  <option value="">All</option>
                  {eventTypeOptions.map((typeOption) => (
                    <option key={typeOption} value={typeOption}>
                      {typeOption}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="input-label">Status</span>
                <select value={eventStatus} onChange={(event) => setEventStatus(event.target.value)}>
                  <option value="">All</option>
                  {eventStatusOptions.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption}
                    </option>
                  ))}
                </select>
              </label>
              <div className="search-field">
                <label className="input-label" htmlFor="event-search">
                  Search
                </label>
                <input
                  id="event-search"
                  type="search"
                  placeholder="Filter by summary"
                  value={eventSearch}
                  onChange={(event) => setEventSearch(event.target.value)}
                />
              </div>
            </div>

            <ul className="events-list">
              {filteredEvents.length === 0 ? (
                <li className="empty-state">No events match the current filters.</li>
              ) : (
                filteredEvents.map((ev, index) => (
                  <li key={`${ev.ts}-${index}`} className="event-card">
                    <div className="event-headline">
                      <strong>{ev.stream}</strong>
                      <span className="event-type">{ev.type}</span>
                      {ev.status && <span className="event-status">{ev.status}</span>}
                    </div>
                    <p className="event-summary">{ev.summary}</p>
                    <p className="event-ts">{formatTimestamp(ev.ts)}</p>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="panel artifacts-panel">
            <div className="panel-header">
              <div>
                <h2>Artifacts</h2>
                <p className="panel-subtitle">Files generated or touched during this run.</p>
              </div>
              <span className="panel-count">{artifacts.length}</span>
            </div>
            {artifacts.length === 0 ? (
              <p className="empty-state">No artifacts yet.</p>
            ) : (
              <ul className="artifact-list">
                {artifacts.map((artifact) => (
                  <li key={artifact.path}>
                    <div className="artifact-path">{artifact.path}</div>
                    <p className="artifact-meta">
                      {artifact.kind} • {new Date(artifact.mtimeMs).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>

        <footer className="app-footer">
          <p>Next: git diffs view.</p>
        </footer>
      </div>
    </div>
  );
}
