import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

type EventArtifact = {
  kind: string;
  value: string;
};

type EventItem = {
  ts: string;
  stream: string;
  type: string;
  summary: string;
  status?: string;
  severity?: string;
  correlationId?: string;
  actor?: string;
  details?: Record<string, unknown>;
  tags?: string[];
  artifacts?: EventArtifact[];
  source?: { session?: string; messageId?: string };
  id?: string;
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
  lastCommitSha?: string;
};

type ChecklistItem = {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  notes?: string;
};

type JobApplication = {
  id: string;
  company: string;
  role: string;
  link?: string;
  status: 'draft' | 'applied' | 'interview' | 'offer' | 'rejected';
  followUpDate?: string;
  resume?: string;
};

type Campaign = {
  id: string;
  name: string;
  status: 'idea' | 'draft' | 'published' | 'measured';
  hypothesis?: string;
  metric?: string;
  result?: string;
  date?: string;
};

type SavedFilter = {
  name: string;
  stream: string;
  type: string;
  status: string;
  limit: number;
  query: string;
};

const SAVED_FILTERS_KEY = 'clawd.savedEventFilters'; // legacy localStorage fallback
const SAVED_FILTERS_API = 'http://127.0.0.1:5174/api/v1/saved-filters';

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
  { value: 'dashboard', label: 'Dashboard' },
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

const formatDetailValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return String(value);
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

type CommitPreview = {
  sha: string;
  message: string;
  author: string;
  ts: string;
  files: string[];
};

const commitPreviews: CommitPreview[] = [
  {
    sha: 'c13a182',
    message: 'Add saved filters and pagination polish',
    author: 'Gary',
    ts: '2026-01-30T16:20:00Z',
    files: ['apps/web/src/ui/App.tsx', 'apps/web/src/ui/App.css']
  },
  {
    sha: 'b4d3a8f',
    message: 'Add event detail drawer experience',
    author: 'Gary',
    ts: '2026-01-29T18:10:00Z',
    files: ['apps/web/src/ui/App.tsx']
  },
  {
    sha: 'a8d7f11',
    message: 'Sketch git review panel layout',
    author: 'Gary',
    ts: '2026-01-28T14:45:00Z',
    files: ['specs/PHASE-2.md', 'apps/web/src/ui/App.css']
  }
];

const commitDiffSnippets: Record<string, string> = {
  c13a182: `diff --git a/apps/web/src/ui/App.tsx b/apps/web/src/ui/App.tsx
@@ -320,6 +330,26 @@
-              <div className="pagination-row">
-                <!-- old controls -->
+              <div className="pagination-row">
+                <!-- new controls with page buttons -->
               </div>
+// saved filters + persistence
`,
  b4d3a8f: `diff --git a/apps/web/src/ui/App.tsx b/apps/web/src/ui/App.tsx
@@ -430,0 +450,32 @@
+// event drawer overlay + detail sections
`,
  a8d7f11: `diff --git a/apps/web/src/ui/App.tsx b/apps/web/src/ui/App.tsx
@@ -530,0 +560,40 @@
+// git review panel + diff placeholder
` 
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
  const [eventLimit, setEventLimit] = useState(25);
  const [eventOffset, setEventOffset] = useState(0);
  const [eventTotal, setEventTotal] = useState(0);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [savedFilterName, setSavedFilterName] = useState('');
  const [activeSavedFilter, setActiveSavedFilter] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedCommitSha, setSelectedCommitSha] = useState(commitPreviews[0].sha);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStream, setNewTaskStream] = useState('job-search');

  const [cannabisChecklist, setCannabisChecklist] = useState<ChecklistItem[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [marketingCampaigns, setMarketingCampaigns] = useState<Campaign[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newAppCompany, setNewAppCompany] = useState('');
  const [newAppRole, setNewAppRole] = useState('');
  const [newCampaignName, setNewCampaignName] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (eventStream) params.set('stream', eventStream);
    if (eventType) params.set('type', eventType);
    if (eventStatus) params.set('status', eventStatus);
    if (eventSearch) params.set('q', eventSearch);
    params.set('limit', String(eventLimit));
    params.set('offset', String(eventOffset));
    params.set('indexed', '1');
    const url = `http://127.0.0.1:5174/api/v1/events${params.toString() ? `?${params}` : ''}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items ?? []);
        setEventTotal(data.total ?? 0);
        setError(null);
      })
      .catch((e) => setError(String(e)));
  }, [eventStream, eventType, eventStatus, eventLimit, eventOffset, eventSearch]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Prefer server-side persistence (data/saved-filters.json). Fall back to localStorage.
    (async () => {
      try {
        const res = await fetch(SAVED_FILTERS_API);
        if (res.ok) {
          const data = (await res.json()) as { items?: SavedFilter[] };
          if (Array.isArray(data.items)) {
            setSavedFilters(data.items);
            return;
          }
        }
      } catch {
        // ignore
      }

      try {
        const stored = window.localStorage.getItem(SAVED_FILTERS_KEY);
        if (stored) setSavedFilters(JSON.parse(stored));
      } catch {
        // ignore corrupted storage
      }
    })();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Keep local fallback
    window.localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(savedFilters));
  }, [savedFilters]);

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

  useEffect(() => {
    fetch('http://127.0.0.1:5174/api/v1/streams/cannabis/checklist')
      .then((r) => r.json())
      .then((data) => setCannabisChecklist(data.items ?? []))
      .catch(() => undefined);

    fetch('http://127.0.0.1:5174/api/v1/streams/job-search/applications')
      .then((r) => r.json())
      .then((data) => setJobApplications(data.items ?? []))
      .catch(() => undefined);

    fetch('http://127.0.0.1:5174/api/v1/streams/marketing/campaigns')
      .then((r) => r.json())
      .then((data) => setMarketingCampaigns(data.items ?? []))
      .catch(() => undefined);
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

  const moveTask = async (task: TaskItem, nextStatus: TaskItem['status']) => {
    await fetch(`http://127.0.0.1:5174/api/v1/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
  };

  const resetActiveFilter = () => setActiveSavedFilter(null);

  const handleSaveFilter = async () => {
    const name = savedFilterName.trim();
    if (!name) return;
    const newFilter: SavedFilter = {
      name,
      stream: eventStream,
      type: eventType,
      status: eventStatus,
      limit: eventLimit,
      query: eventSearch
    };

    // Persist server-side (falls back to local state if API unavailable)
    try {
      await fetch(SAVED_FILTERS_API, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(newFilter)
      });
    } catch {
      // ignore
    }

    setSavedFilters((prev) => [newFilter, ...prev.filter((filter) => filter.name.toLowerCase() !== name.toLowerCase())]);
    setSavedFilterName('');
    setActiveSavedFilter(name);
  };

  const addChecklistItem = async () => {
    if (!newChecklistTitle.trim()) return;
    const next: ChecklistItem = {
      id: crypto.randomUUID(),
      title: newChecklistTitle.trim(),
      status: 'todo'
    };
    const updated = [next, ...cannabisChecklist];
    setCannabisChecklist(updated);
    setNewChecklistTitle('');
    await fetch('http://127.0.0.1:5174/api/v1/streams/cannabis/checklist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: updated })
    });
  };

  const addJobApplication = async () => {
    if (!newAppCompany.trim() || !newAppRole.trim()) return;
    const next: JobApplication = {
      id: crypto.randomUUID(),
      company: newAppCompany.trim(),
      role: newAppRole.trim(),
      status: 'draft'
    };
    const updated = [next, ...jobApplications];
    setJobApplications(updated);
    setNewAppCompany('');
    setNewAppRole('');
    await fetch('http://127.0.0.1:5174/api/v1/streams/job-search/applications', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: updated })
    });
  };

  const addCampaign = async () => {
    if (!newCampaignName.trim()) return;
    const next: Campaign = {
      id: crypto.randomUUID(),
      name: newCampaignName.trim(),
      status: 'idea'
    };
    const updated = [next, ...marketingCampaigns];
    setMarketingCampaigns(updated);
    setNewCampaignName('');
    await fetch('http://127.0.0.1:5174/api/v1/streams/marketing/campaigns', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: updated })
    });
  };

  const handleApplySavedFilter = (filter: SavedFilter) => {
    setEventStream(filter.stream);
    setEventType(filter.type);
    setEventStatus(filter.status);
    setEventLimit(filter.limit);
    setEventSearch(filter.query);
    setEventOffset(0);
    setActiveSavedFilter(filter.name);
  };

  const handleRemoveSavedFilter = (name: string) => {
    setSavedFilters((prev) => prev.filter((filter) => filter.name !== name));
    if (activeSavedFilter === name) {
      setActiveSavedFilter(null);
    }
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

  const safeEventLimit = Math.max(1, eventLimit);
  const totalPages = Math.max(1, Math.ceil(eventTotal / safeEventLimit));
  const currentPage = Math.max(0, Math.min(totalPages - 1, Math.floor(eventOffset / safeEventLimit)));
  const pageWindow = 5;
  const maxWindowStart = Math.max(0, totalPages - pageWindow);
  const windowStart = Math.min(Math.max(0, currentPage - Math.floor(pageWindow / 2)), maxWindowStart);
  const windowEnd = Math.min(totalPages, windowStart + pageWindow);
  const visiblePages = Array.from({ length: Math.max(1, windowEnd - windowStart) }, (_, idx) => windowStart + idx);
  const pageRangeStart = eventTotal === 0 ? 0 : eventOffset + 1;
  const pageRangeEnd = Math.min(eventOffset + eventLimit, eventTotal);
  const pageRangeLabel = eventTotal === 0 ? '0 of 0' : `${pageRangeStart}–${pageRangeEnd} of ${eventTotal}`;

  const goToPage = (pageIndex: number) => {
    setEventOffset(Math.max(0, pageIndex * eventLimit));
  };
  const goFirst = () => goToPage(0);
  const goPrev = () => goToPage(Math.max(0, currentPage - 1));
  const goNext = () => goToPage(Math.min(totalPages - 1, currentPage + 1));
  const goLast = () => goToPage(totalPages - 1);
  const activeCommit = commitPreviews.find((commit) => commit.sha === selectedCommitSha) ?? commitPreviews[0];
  const activeDiff = commitDiffSnippets[selectedCommitSha] ?? 'Diff preview placeholder';

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

        <div className="integrity-banner">
          Log integrity: <span className="status-pill status-ok">OK</span>
          <button
            type="button"
            className="ghost"
            onClick={async () => {
              try {
                const res = await fetch('http://127.0.0.1:5174/api/v1/integrity/check');
                const data = await res.json();
                console.log('Integrity', data);
              } catch {
                // ignore
              }
            }}
          >
            Verify log
          </button>
        </div>

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
                            <div className="task-actions">
                              {column !== 'backlog' && (
                                <button
                                  type="button"
                                  className="ghost"
                                  onClick={() => moveTask(task, columns[Math.max(0, columns.indexOf(column) - 1)])}
                                >
                                  ←
                                </button>
                              )}
                              {column !== 'done' && (
                                <button
                                  type="button"
                                  className="ghost"
                                  onClick={() => moveTask(task, columns[Math.min(columns.length - 1, columns.indexOf(column) + 1)])}
                                >
                                  →
                                </button>
                              )}
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

          <section className="panel streams-panel">
            <div className="panel-header">
              <div>
                <h2>Stream modules</h2>
                <p className="panel-subtitle">Operational checklists and trackers.</p>
              </div>
              <span className="panel-count">
                {cannabisChecklist.length + jobApplications.length + marketingCampaigns.length} items
              </span>
            </div>
            <div className="stream-grid">
              <div className="stream-card">
                <h3>Cannabis (ON) checklist</h3>
                <div className="stream-form">
                  <input
                    placeholder="Checklist item"
                    value={newChecklistTitle}
                    onChange={(event) => setNewChecklistTitle(event.target.value)}
                  />
                  <button type="button" className="ghost" onClick={addChecklistItem}>
                    Add
                  </button>
                </div>
                <ul>
                  {cannabisChecklist.slice(0, 5).map((item) => (
                    <li key={item.id}>
                      {item.title} • {item.status}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="stream-card">
                <h3>Job applications</h3>
                <div className="stream-form">
                  <input
                    placeholder="Company"
                    value={newAppCompany}
                    onChange={(event) => setNewAppCompany(event.target.value)}
                  />
                  <input
                    placeholder="Role"
                    value={newAppRole}
                    onChange={(event) => setNewAppRole(event.target.value)}
                  />
                  <button type="button" className="ghost" onClick={addJobApplication}>
                    Add
                  </button>
                </div>
                <ul>
                  {jobApplications.slice(0, 5).map((app) => (
                    <li key={app.id}>
                      {app.company} — {app.role} • {app.status}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="stream-card">
                <h3>Marketing campaigns</h3>
                <div className="stream-form">
                  <input
                    placeholder="Campaign"
                    value={newCampaignName}
                    onChange={(event) => setNewCampaignName(event.target.value)}
                  />
                  <button type="button" className="ghost" onClick={addCampaign}>
                    Add
                  </button>
                </div>
                <ul>
                  {marketingCampaigns.slice(0, 5).map((campaign) => (
                    <li key={campaign.id}>
                      {campaign.name} • {campaign.status}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="panel events-panel">
            <div className="panel-header">
              <div>
                <h2>Recent events</h2>
                <p className="panel-subtitle">Audit log entries streamed from Clawd.</p>
              </div>
              <span className="panel-count">{eventTotal} total</span>
            </div>

            <div className="filters-row">
              <label>
                <span className="input-label">Stream</span>
                <select
                  value={eventStream}
                  onChange={(event) => {
                    setEventStream(event.target.value);
                    setEventOffset(0);
                    resetActiveFilter();
                  }}
                >
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
                <select
                  value={eventType}
                  onChange={(event) => {
                    setEventType(event.target.value);
                    setEventOffset(0);
                    resetActiveFilter();
                  }}
                >
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
                <select
                  value={eventStatus}
                  onChange={(event) => {
                    setEventStatus(event.target.value);
                    setEventOffset(0);
                    resetActiveFilter();
                  }}
                >
                  <option value="">All</option>
                  {eventStatusOptions.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="input-label">Per page</span>
                <select
                  value={eventLimit}
                  onChange={(event) => {
                    setEventLimit(Number(event.target.value));
                    setEventOffset(0);
                    resetActiveFilter();
                  }}
                >
                  {[10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
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
                  onChange={(event) => {
                    setEventSearch(event.target.value);
                    resetActiveFilter();
                  }}
                />
              </div>
            </div>

            <div className="pagination-row">
              <div className="pagination-controls">
                <button type="button" className="ghost" onClick={goFirst} disabled={currentPage === 0}>
                  First
                </button>
                <button type="button" className="ghost" onClick={goPrev} disabled={currentPage === 0}>
                  Prev
                </button>
              </div>
              <span className="page-meta">
                Page {currentPage + 1} of {totalPages} • Showing {pageRangeLabel}
              </span>
              <div className="page-buttons">
                {visiblePages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`page-button${page === currentPage ? ' active' : ''}`}
                    onClick={() => goToPage(page)}
                  >
                    {page + 1}
                  </button>
                ))}
              </div>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="ghost"
                  onClick={goNext}
                  disabled={currentPage >= totalPages - 1}
                >
                  Next
                </button>
                <button
                  type="button"
                  className="ghost"
                  onClick={goLast}
                  disabled={currentPage >= totalPages - 1}
                >
                  Last
                </button>
              </div>
            </div>

            <div className="saved-filters-section">
              <div className="saved-filters-header">
                <div>
                  <h3>Saved filters</h3>
                  <p className="panel-subtitle">Quickly jump back to curated views.</p>
                </div>
                {activeSavedFilter && (
                  <button type="button" className="link-button" onClick={() => setActiveSavedFilter(null)}>
                    Clear active filter
                  </button>
                )}
              </div>
              {savedFilters.length === 0 ? (
                <p className="empty-state">No saved filters yet. Save a configuration to reuse it.</p>
              ) : (
                <div className="saved-filters-list">
                  {savedFilters.map((filter) => (
                    <div
                      key={filter.name}
                      className={`saved-filter-card ${activeSavedFilter === filter.name ? 'is-active' : ''}`}
                    >
                      <div>
                        <p className="saved-filter-name">{filter.name}</p>
                        <div className="saved-filter-meta">
                          <span>{filter.stream || 'All streams'}</span>
                          <span>{filter.type || 'All types'}</span>
                          <span>{filter.status || 'Any status'}</span>
                          <span>per page {filter.limit}</span>
                          {filter.query && <span>q: {filter.query}</span>}
                        </div>
                      </div>
                      <div className="saved-filter-actions">
                        <button
                          type="button"
                          className="ghost small"
                          onClick={() => handleApplySavedFilter(filter)}
                        >
                          {activeSavedFilter === filter.name ? 'Reapply' : 'Apply'}
                        </button>
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => handleRemoveSavedFilter(filter.name)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="saved-filter-controls">
                <input
                  type="text"
                  placeholder="Save current filters as..."
                  value={savedFilterName}
                  onChange={(event) => setSavedFilterName(event.target.value)}
                />
                <button type="button" className="primary" onClick={handleSaveFilter} disabled={!savedFilterName.trim()}>
                  Save filter
                </button>
              </div>
            </div>

            <ul className="events-list">
              {filteredEvents.length === 0 ? (
                <li className="empty-state">No events match the current filters.</li>
              ) : (
                filteredEvents.map((ev, index) => (
                  <li
                    key={`${ev.ts}-${index}`}
                    className="event-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedEvent(ev)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedEvent(ev);
                      }
                    }}
                  >
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
                      {artifact.lastCommitSha ? ` • ${artifact.lastCommitSha.slice(0, 7)}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel git-panel">
            <div className="panel-header">
              <div>
                <h2>Git review</h2>
                <p className="panel-subtitle">Browse recent commits and docked diff placeholders.</p>
              </div>
              <span className="panel-count">{commitPreviews.length} entries</span>
            </div>
            <div className="git-panel-body">
              <div className="commit-column">
                <h3>Commits</h3>
                <ul className="commit-list">
                  {commitPreviews.map((commit) => (
                    <li
                      key={commit.sha}
                      className={`commit-card ${selectedCommitSha === commit.sha ? 'is-active' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedCommitSha(commit.sha)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedCommitSha(commit.sha);
                        }
                      }}
                    >
                      <strong>{commit.message}</strong>
                      <p className="commit-meta">
                        {commit.author} • {formatTimestamp(commit.ts)} • {commit.files.length} files changed
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="diff-column">
                <div className="diff-header">
                  <p className="eyebrow">Diff viewer</p>
                  <h3>{activeCommit.message}</h3>
                  <p className="commit-meta">
                    {activeCommit.author} • {formatTimestamp(activeCommit.ts)}
                  </p>
                  <div className="file-chip-row">
                    {activeCommit.files.slice(0, 3).map((file) => (
                      <span key={file} className="file-chip">
                        {file}
                      </span>
                    ))}
                    {activeCommit.files.length > 3 && (
                      <span className="file-chip">+{activeCommit.files.length - 3} more</span>
                    )}
                  </div>
                </div>
                <div className="diff-placeholder">
                  <pre>{activeDiff}</pre>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="app-footer">
          <p>Next: git diffs view.</p>
        </footer>
        {selectedEvent && (
          <div className="event-drawer-wrapper" role="presentation">
            <div className="event-drawer-backdrop" onClick={() => setSelectedEvent(null)} />
            <aside className="event-drawer" role="dialog" aria-modal="true" aria-label="Event details">
              <div className="drawer-header">
                <div>
                  <p className="eyebrow">{selectedEvent.stream}</p>
                  <h3>{selectedEvent.summary}</h3>
                  <p className="event-ts">{formatTimestamp(selectedEvent.ts)}</p>
                </div>
                <button type="button" className="ghost" onClick={() => setSelectedEvent(null)}>
                  Close
                </button>
              </div>
              <div className="drawer-chips">
                <span className="detail-chip">{selectedEvent.type}</span>
                {selectedEvent.status && <span className="detail-chip detail-chip-muted">{selectedEvent.status}</span>}
                {selectedEvent.severity && (
                  <span className="detail-chip detail-chip-accent">{selectedEvent.severity}</span>
                )}
                {selectedEvent.correlationId && (
                  <span className="detail-chip detail-chip-accent">corr: {selectedEvent.correlationId}</span>
                )}
              </div>
              {selectedEvent.details && (
                <div className="drawer-section">
                  <h4>Details</h4>
                  <div className="detail-grid">
                    {Object.entries(selectedEvent.details).map(([key, value]) => (
                      <div key={key} className="detail-row">
                        <span className="detail-key">{key}</span>
                        <span className="detail-value">{formatDetailValue(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedEvent.artifacts && selectedEvent.artifacts.length > 0 && (
                <div className="drawer-section">
                  <h4>Related artifacts</h4>
                  <ul className="drawer-list">
                    {selectedEvent.artifacts.map((artifact) => (
                      <li key={`${artifact.kind}-${artifact.value}`}>
                        <span className="detail-key">{artifact.kind}</span>
                        <span className="detail-value">{artifact.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                <div className="drawer-section">
                  <h4>Tags</h4>
                  <div className="tag-row">
                    {selectedEvent.tags.map((tag) => (
                      <span key={tag} className="tag-pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(selectedEvent.actor || selectedEvent.source) && (
                <div className="drawer-section">
                  <h4>Source</h4>
                  {selectedEvent.actor && <p className="detail-value">Actor: {selectedEvent.actor}</p>}
                  {selectedEvent.source?.session && (
                    <p className="detail-value">Session: {selectedEvent.source.session}</p>
                  )}
                  {selectedEvent.source?.messageId && (
                    <p className="detail-value">Msg ID: {selectedEvent.source.messageId}</p>
                  )}
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
