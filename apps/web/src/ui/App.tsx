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

type IndexStatus = {
  offsets: { events: number; tasks: number };
  lineCounts: { events: number; tasks: number };
  lag: { events: number; tasks: number };
  dbCounts: { events: number; tasks: number };
  mismatch: { events: boolean; tasks: boolean };
  lastIndexed: { eventsTs?: string; tasksTs?: string };
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
  taskId?: string;
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

type DigestSubscription = {
  id: string;
  channel: string;
  to: string;
  enabled: boolean;
};

const SAVED_FILTERS_KEY = 'clawd.savedEventFilters'; // legacy localStorage fallback
const SAVED_FILTERS_API = 'http://127.0.0.1:5174/api/v1/saved-filters';

const DIGEST_SUBSCRIPTIONS_API = 'http://127.0.0.1:5174/api/v1/digest/subscriptions';
const DIGEST_PREVIEW_API = 'http://127.0.0.1:5174/api/v1/digest/daily';

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

  const [digestSubscriptions, setDigestSubscriptions] = useState<DigestSubscription[]>([]);
  const [newDigestChannel, setNewDigestChannel] = useState('telegram');
  const [newDigestTo, setNewDigestTo] = useState('');
  const [digestPreview, setDigestPreview] = useState<string>('');
  const [digestError, setDigestError] = useState<string | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStream, setNewTaskStream] = useState('job-search');

  const [cannabisChecklist, setCannabisChecklist] = useState<ChecklistItem[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [marketingCampaigns, setMarketingCampaigns] = useState<Campaign[]>([]);

  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newChecklistNotes, setNewChecklistNotes] = useState('');

  const [newAppCompany, setNewAppCompany] = useState('');
  const [newAppRole, setNewAppRole] = useState('');
  const [newAppLink, setNewAppLink] = useState('');
  const [newAppStatus, setNewAppStatus] = useState<JobApplication['status']>('draft');
  const [newAppFollowUpDate, setNewAppFollowUpDate] = useState('');
  const [newAppResume, setNewAppResume] = useState('');
  const [newAppTaskId, setNewAppTaskId] = useState('');

  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignStatus, setNewCampaignStatus] = useState<Campaign['status']>('idea');
  const [newCampaignHypothesis, setNewCampaignHypothesis] = useState('');
  const [newCampaignMetric, setNewCampaignMetric] = useState('');
  const [newCampaignResult, setNewCampaignResult] = useState('');
  const [newCampaignDate, setNewCampaignDate] = useState('');
  const [integrityStatus, setIntegrityStatus] = useState<'ok' | 'fail' | 'unknown'>('unknown');
  const [integrityMessage, setIntegrityMessage] = useState('');

  const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null);

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

    fetch(DIGEST_SUBSCRIPTIONS_API)
      .then((r) => r.json())
      .then((data) => setDigestSubscriptions(data.items ?? []))
      .catch(() => undefined);

    fetch('http://127.0.0.1:5174/api/v1/integrity/check')
      .then((r) => r.json())
      .then((data) => {
        setIntegrityStatus(data.ok ? 'ok' : 'fail');
        setIntegrityMessage(data.message ?? '');
      })
      .catch(() => {
        setIntegrityStatus('unknown');
      });

    fetch('http://127.0.0.1:5174/api/v1/index/status')
      .then((r) => r.json())
      .then((data) => {
        setIndexStatus(data.status ?? null);
      })
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

  const persistCannabisChecklist = async (nextItems: ChecklistItem[]) => {
    await fetch('http://127.0.0.1:5174/api/v1/streams/cannabis/checklist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: nextItems })
    });
  };

  const addChecklistItem = async () => {
    if (!newChecklistTitle.trim()) return;
    const next: ChecklistItem = {
      id: crypto.randomUUID(),
      title: newChecklistTitle.trim(),
      status: 'todo',
      notes: newChecklistNotes.trim() ? newChecklistNotes.trim() : undefined
    };
    const updated = [next, ...cannabisChecklist];
    setCannabisChecklist(updated);
    setNewChecklistTitle('');
    setNewChecklistNotes('');
    await persistCannabisChecklist(updated);
  };

  const updateChecklistItem = async (id: string, patch: Partial<ChecklistItem>) => {
    const updated = cannabisChecklist.map((item) => (item.id === id ? { ...item, ...patch } : item));
    setCannabisChecklist(updated);
    await persistCannabisChecklist(updated);
  };

  const deleteChecklistItem = async (id: string) => {
    const updated = cannabisChecklist.filter((item) => item.id !== id);
    setCannabisChecklist(updated);
    await persistCannabisChecklist(updated);
  };

  const persistJobApplications = async (nextItems: JobApplication[]) => {
    await fetch('http://127.0.0.1:5174/api/v1/streams/job-search/applications', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: nextItems })
    });
  };

  const addJobApplication = async () => {
    if (!newAppCompany.trim() || !newAppRole.trim()) return;
    const next: JobApplication = {
      id: crypto.randomUUID(),
      company: newAppCompany.trim(),
      role: newAppRole.trim(),
      link: newAppLink.trim() ? newAppLink.trim() : undefined,
      status: newAppStatus,
      followUpDate: newAppFollowUpDate.trim() ? newAppFollowUpDate.trim() : undefined,
      resume: newAppResume.trim() ? newAppResume.trim() : undefined,
      taskId: newAppTaskId.trim() ? newAppTaskId.trim() : undefined
    };
    const updated = [next, ...jobApplications];
    setJobApplications(updated);
    setNewAppCompany('');
    setNewAppRole('');
    setNewAppLink('');
    setNewAppStatus('draft');
    setNewAppFollowUpDate('');
    setNewAppResume('');
    setNewAppTaskId('');
    await persistJobApplications(updated);
  };

  const updateJobApplication = async (id: string, patch: Partial<JobApplication>) => {
    const updated = jobApplications.map((app) => (app.id === id ? { ...app, ...patch } : app));
    setJobApplications(updated);
    await persistJobApplications(updated);
  };

  const deleteJobApplication = async (id: string) => {
    const updated = jobApplications.filter((app) => app.id !== id);
    setJobApplications(updated);
    await persistJobApplications(updated);
  };

  const persistMarketingCampaigns = async (nextItems: Campaign[]) => {
    await fetch('http://127.0.0.1:5174/api/v1/streams/marketing/campaigns', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: nextItems })
    });
  };

  const addCampaign = async () => {
    if (!newCampaignName.trim()) return;
    const next: Campaign = {
      id: crypto.randomUUID(),
      name: newCampaignName.trim(),
      status: newCampaignStatus,
      hypothesis: newCampaignHypothesis.trim() ? newCampaignHypothesis.trim() : undefined,
      metric: newCampaignMetric.trim() ? newCampaignMetric.trim() : undefined,
      result: newCampaignResult.trim() ? newCampaignResult.trim() : undefined,
      date: newCampaignDate.trim() ? newCampaignDate.trim() : undefined
    };
    const updated = [next, ...marketingCampaigns];
    setMarketingCampaigns(updated);
    setNewCampaignName('');
    setNewCampaignStatus('idea');
    setNewCampaignHypothesis('');
    setNewCampaignMetric('');
    setNewCampaignResult('');
    setNewCampaignDate('');
    await persistMarketingCampaigns(updated);
  };

  const updateCampaign = async (id: string, patch: Partial<Campaign>) => {
    const updated = marketingCampaigns.map((campaign) => (campaign.id === id ? { ...campaign, ...patch } : campaign));
    setMarketingCampaigns(updated);
    await persistMarketingCampaigns(updated);
  };

  const deleteCampaign = async (id: string) => {
    const updated = marketingCampaigns.filter((campaign) => campaign.id !== id);
    setMarketingCampaigns(updated);
    await persistMarketingCampaigns(updated);
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
          Log integrity:{' '}
          <span
            className={`status-pill ${
              integrityStatus === 'ok' ? 'status-ok' : integrityStatus === 'fail' ? 'status-bad' : 'status-unknown'
            }`}
          >
            {integrityStatus === 'ok' ? 'OK' : integrityStatus === 'fail' ? 'FAIL' : 'Unknown'}
          </span>
          {integrityMessage && <span className="integrity-message">{integrityMessage}</span>}
          <button
            type="button"
            className="ghost"
            onClick={async () => {
              try {
                const res = await fetch('http://127.0.0.1:5174/api/v1/integrity/check');
                const data = await res.json();
                setIntegrityStatus(data.ok ? 'ok' : 'fail');
                setIntegrityMessage(data.message ?? '');
              } catch {
                setIntegrityStatus('fail');
                setIntegrityMessage('Check failed');
              }
            }}
          >
            Verify log
          </button>

          <span className="meta-caption">
            Index:{' '}
            {indexStatus ? (
              <>
                {indexStatus.lag.events === 0 && indexStatus.lag.tasks === 0 ? 'OK' : 'Lagging'} • ev {indexStatus.dbCounts.events}/
                {indexStatus.lineCounts.events} • tasks {indexStatus.dbCounts.tasks}/{indexStatus.lineCounts.tasks}
                {(indexStatus.mismatch.events || indexStatus.mismatch.tasks) && ' • mismatch'}
              </>
            ) : (
              'Unknown'
            )}
          </span>
          <button
            type="button"
            className="ghost"
            onClick={async () => {
              try {
                const res = await fetch('http://127.0.0.1:5174/api/v1/index/status');
                const data = await res.json();
                setIndexStatus(data.status ?? null);
              } catch {
                // ignore
              }
            }}
          >
            Refresh index
          </button>
          <button
            type="button"
            className="ghost"
            onClick={async () => {
              try {
                await fetch('http://127.0.0.1:5174/api/v1/index/tick', { method: 'POST' });
                const res = await fetch('http://127.0.0.1:5174/api/v1/index/status');
                const data = await res.json();
                setIndexStatus(data.status ?? null);
              } catch {
                // ignore
              }
            }}
          >
            Tick index
          </button>
          <button
            type="button"
            className="ghost"
            onClick={async () => {
              try {
                await fetch('http://127.0.0.1:5174/api/v1/index/rebuild', { method: 'POST' });
                const res = await fetch('http://127.0.0.1:5174/api/v1/index/status');
                const data = await res.json();
                setIndexStatus(data.status ?? null);
              } catch {
                // ignore
              }
            }}
          >
            Rebuild index
          </button>
          <a className="ghost" href="http://127.0.0.1:5174/api/v1/streams/cannabis/checklist/export">
            Checklist CSV
          </a>
          <a className="ghost" href="http://127.0.0.1:5174/api/v1/streams/cannabis/checklist/report.md">
            Checklist MD
          </a>
          <a className="ghost" href="http://127.0.0.1:5174/api/v1/streams/job-search/applications/export">
            Applications CSV
          </a>
          <a className="ghost" href="http://127.0.0.1:5174/api/v1/streams/job-search/applications/report.md">
            Applications MD
          </a>
          <a className="ghost" href="http://127.0.0.1:5174/api/v1/streams/marketing/campaigns/export">
            Campaigns CSV
          </a>
          <a className="ghost" href="http://127.0.0.1:5174/api/v1/streams/marketing/campaigns/report.md">
            Campaigns MD
          </a>
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
                  <input
                    placeholder="Notes"
                    value={newChecklistNotes}
                    onChange={(event) => setNewChecklistNotes(event.target.value)}
                  />
                  <button type="button" className="ghost" onClick={addChecklistItem}>
                    Add
                  </button>
                </div>
                {cannabisChecklist.length === 0 ? (
                  <p className="empty-state">No checklist items yet.</p>
                ) : (
                  <ul className="stream-list">
                    {cannabisChecklist.map((item) => (
                      <li key={item.id} className="checklist-row">
                        <input
                          value={item.title}
                          onChange={(event) => updateChecklistItem(item.id, { title: event.target.value })}
                        />
                        <select
                          value={item.status}
                          onChange={(event) => updateChecklistItem(item.id, { status: event.target.value as ChecklistItem['status'] })}
                        >
                          <option value="todo">todo</option>
                          <option value="in_progress">in_progress</option>
                          <option value="done">done</option>
                        </select>
                        <input
                          value={item.notes ?? ''}
                          placeholder="notes"
                          onChange={(event) => updateChecklistItem(item.id, { notes: event.target.value || undefined })}
                        />
                        <button type="button" className="ghost" onClick={() => deleteChecklistItem(item.id)}>
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="stream-card">
                <h3>Job applications</h3>
                <div className="stream-form">
                  <input
                    placeholder="Company"
                    value={newAppCompany}
                    onChange={(event) => setNewAppCompany(event.target.value)}
                  />
                  <input placeholder="Role" value={newAppRole} onChange={(event) => setNewAppRole(event.target.value)} />
                  <input placeholder="Link" value={newAppLink} onChange={(event) => setNewAppLink(event.target.value)} />
                  <select value={newAppStatus} onChange={(event) => setNewAppStatus(event.target.value as JobApplication['status'])}>
                    <option value="draft">draft</option>
                    <option value="applied">applied</option>
                    <option value="interview">interview</option>
                    <option value="offer">offer</option>
                    <option value="rejected">rejected</option>
                  </select>
                  <input
                    type="date"
                    value={newAppFollowUpDate}
                    onChange={(event) => setNewAppFollowUpDate(event.target.value)}
                  />
                  <input
                    placeholder="Resume version"
                    value={newAppResume}
                    onChange={(event) => setNewAppResume(event.target.value)}
                  />
                  <select value={newAppTaskId} onChange={(event) => setNewAppTaskId(event.target.value)}>
                    <option value="">No task</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="ghost" onClick={addJobApplication}>
                    Add
                  </button>
                </div>
                {jobApplications.length === 0 ? (
                  <p className="empty-state">No applications yet.</p>
                ) : (
                  <ul className="stream-list">
                    {jobApplications.map((app) => (
                      <li key={app.id} className="job-row">
                        <input value={app.company} onChange={(event) => updateJobApplication(app.id, { company: event.target.value })} />
                        <input value={app.role} onChange={(event) => updateJobApplication(app.id, { role: event.target.value })} />
                        <input
                          value={app.link ?? ''}
                          placeholder="link"
                          onChange={(event) => updateJobApplication(app.id, { link: event.target.value || undefined })}
                        />
                        <select
                          value={app.status}
                          onChange={(event) => updateJobApplication(app.id, { status: event.target.value as JobApplication['status'] })}
                        >
                          <option value="draft">draft</option>
                          <option value="applied">applied</option>
                          <option value="interview">interview</option>
                          <option value="offer">offer</option>
                          <option value="rejected">rejected</option>
                        </select>
                        <input
                          type="date"
                          value={app.followUpDate ?? ''}
                          onChange={(event) => updateJobApplication(app.id, { followUpDate: event.target.value || undefined })}
                        />
                        <input
                          value={app.resume ?? ''}
                          placeholder="resume"
                          onChange={(event) => updateJobApplication(app.id, { resume: event.target.value || undefined })}
                        />
                        <select
                          value={app.taskId ?? ''}
                          onChange={(event) => updateJobApplication(app.id, { taskId: event.target.value || undefined })}
                        >
                          <option value="">No task</option>
                          {tasks.map((task) => (
                            <option key={task.id} value={task.id}>
                              {task.title}
                            </option>
                          ))}
                        </select>
                        <button type="button" className="ghost" onClick={() => deleteJobApplication(app.id)}>
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="stream-card">
                <h3>Marketing campaigns</h3>
                <div className="stream-form">
                  <input
                    placeholder="Campaign"
                    value={newCampaignName}
                    onChange={(event) => setNewCampaignName(event.target.value)}
                  />
                  <select
                    value={newCampaignStatus}
                    onChange={(event) => setNewCampaignStatus(event.target.value as Campaign['status'])}
                  >
                    <option value="idea">idea</option>
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                    <option value="measured">measured</option>
                  </select>
                  <input
                    placeholder="Hypothesis"
                    value={newCampaignHypothesis}
                    onChange={(event) => setNewCampaignHypothesis(event.target.value)}
                  />
                  <input
                    placeholder="Metric"
                    value={newCampaignMetric}
                    onChange={(event) => setNewCampaignMetric(event.target.value)}
                  />
                  <input
                    placeholder="Result"
                    value={newCampaignResult}
                    onChange={(event) => setNewCampaignResult(event.target.value)}
                  />
                  <input type="date" value={newCampaignDate} onChange={(event) => setNewCampaignDate(event.target.value)} />
                  <button type="button" className="ghost" onClick={addCampaign}>
                    Add
                  </button>
                </div>
                {marketingCampaigns.length === 0 ? (
                  <p className="empty-state">No campaigns yet.</p>
                ) : (
                  <ul className="stream-list">
                    {marketingCampaigns.map((campaign) => (
                      <li key={campaign.id} className="campaign-row">
                        <input
                          value={campaign.name}
                          onChange={(event) => updateCampaign(campaign.id, { name: event.target.value })}
                        />
                        <select
                          value={campaign.status}
                          onChange={(event) => updateCampaign(campaign.id, { status: event.target.value as Campaign['status'] })}
                        >
                          <option value="idea">idea</option>
                          <option value="draft">draft</option>
                          <option value="published">published</option>
                          <option value="measured">measured</option>
                        </select>
                        <input
                          value={campaign.hypothesis ?? ''}
                          placeholder="hypothesis"
                          onChange={(event) => updateCampaign(campaign.id, { hypothesis: event.target.value || undefined })}
                        />
                        <input
                          value={campaign.metric ?? ''}
                          placeholder="metric"
                          onChange={(event) => updateCampaign(campaign.id, { metric: event.target.value || undefined })}
                        />
                        <input
                          value={campaign.result ?? ''}
                          placeholder="result"
                          onChange={(event) => updateCampaign(campaign.id, { result: event.target.value || undefined })}
                        />
                        <input
                          type="date"
                          value={campaign.date ?? ''}
                          onChange={(event) => updateCampaign(campaign.id, { date: event.target.value || undefined })}
                        />
                        <button type="button" className="ghost" onClick={() => deleteCampaign(campaign.id)}>
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <section className="panel digest-panel">
            <div className="panel-header">
              <div>
                <h2>Digest delivery</h2>
                <p className="panel-subtitle">Manage subscriptions and preview the daily digest.</p>
              </div>
              <span className="panel-count">{digestSubscriptions.length} subs</span>
            </div>

            {digestError && <div className="error-card">{digestError}</div>}

            <div className="digest-grid">
              <div className="digest-card">
                <h3>Subscriptions</h3>

                <div className="stream-form">
                  <select value={newDigestChannel} onChange={(event) => setNewDigestChannel(event.target.value)}>
                    <option value="telegram">telegram</option>
                    <option value="signal">signal</option>
                    <option value="discord">discord</option>
                  </select>
                  <input placeholder="to" value={newDigestTo} onChange={(event) => setNewDigestTo(event.target.value)} />
                  <button
                    type="button"
                    className="ghost"
                    onClick={async () => {
                      const to = newDigestTo.trim();
                      if (!to) return;
                      setDigestError(null);
                      try {
                        const res = await fetch(DIGEST_SUBSCRIPTIONS_API, {
                          method: 'POST',
                          headers: { 'content-type': 'application/json' },
                          body: JSON.stringify({ channel: newDigestChannel, to, enabled: true })
                        });
                        if (!res.ok) throw new Error(`Failed to save subscription (${res.status})`);
                        const refreshed = await fetch(DIGEST_SUBSCRIPTIONS_API).then((r) => r.json());
                        setDigestSubscriptions(refreshed.items ?? []);
                        setNewDigestTo('');
                      } catch (err) {
                        setDigestError(String(err));
                      }
                    }}
                  >
                    Add
                  </button>
                </div>

                {digestSubscriptions.length === 0 ? (
                  <p className="empty-state">No subscriptions yet.</p>
                ) : (
                  <ul className="digest-sub-list">
                    {digestSubscriptions.map((sub) => (
                      <li key={sub.id} className="digest-sub-row">
                        <code>
                          {sub.channel}:{sub.to}
                        </code>
                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={sub.enabled}
                            onChange={async (event) => {
                              const enabled = event.target.checked;
                              setDigestError(null);
                              try {
                                const res = await fetch(DIGEST_SUBSCRIPTIONS_API, {
                                  method: 'POST',
                                  headers: { 'content-type': 'application/json' },
                                  body: JSON.stringify({ id: sub.id, channel: sub.channel, to: sub.to, enabled })
                                });
                                if (!res.ok) throw new Error(`Failed to update subscription (${res.status})`);
                                setDigestSubscriptions((prev) => prev.map((s) => (s.id === sub.id ? { ...s, enabled } : s)));
                              } catch (err) {
                                setDigestError(String(err));
                              }
                            }}
                          />
                          <span>enabled</span>
                        </label>
                        <button
                          type="button"
                          className="ghost"
                          onClick={async () => {
                            setDigestError(null);
                            try {
                              const res = await fetch(`${DIGEST_SUBSCRIPTIONS_API}/${sub.id}`, { method: 'DELETE' });
                              if (!res.ok) throw new Error(`Failed to delete subscription (${res.status})`);
                              setDigestSubscriptions((prev) => prev.filter((s) => s.id !== sub.id));
                            } catch (err) {
                              setDigestError(String(err));
                            }
                          }}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="digest-card">
                <h3>Daily digest preview</h3>
                <div className="digest-actions">
                  <button
                    type="button"
                    className="primary"
                    onClick={async () => {
                      setDigestError(null);
                      try {
                        const res = await fetch(DIGEST_PREVIEW_API);
                        if (!res.ok) throw new Error(`Failed to fetch digest (${res.status})`);
                        const data = (await res.json()) as { digest?: string };
                        setDigestPreview(data.digest ?? '');
                      } catch (err) {
                        setDigestError(String(err));
                      }
                    }}
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(digestPreview);
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    Copy
                  </button>
                </div>
                <pre className="digest-preview">{digestPreview || 'No preview yet.'}</pre>
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
