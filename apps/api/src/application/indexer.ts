import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

type OffsetState = {
  events: number;
  tasks: number;
};

export type IndexResult = {
  events: number;
  tasks: number;
};

export class IndexService {
  private db: Database.Database;
  private offsetPath: string;
  private eventsPath: string;
  private tasksPath: string;

  constructor(private readonly rootDir: string) {
    this.offsetPath = path.join(this.rootDir, 'data', 'indexer-offset.json');
    this.eventsPath = path.join(this.rootDir, 'data', 'events.jsonl');
    this.tasksPath = path.join(this.rootDir, 'data', 'tasks.jsonl');
    const dbPath = path.join(this.rootDir, 'data', 'index.sqlite');
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.ensureSchema();
  }

  rebuild(): IndexResult {
    this.resetOffsets();
    return this.ingestAll();
  }

  tick(): IndexResult {
    return this.ingestPartial();
  }

  private ensureSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        ts TEXT,
        stream TEXT,
        type TEXT,
        severity TEXT,
        actor TEXT,
        correlation_id TEXT,
        summary TEXT,
        status TEXT,
        json TEXT
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        ts TEXT,
        stream TEXT,
        status TEXT,
        title TEXT,
        json TEXT
      );
    `);
  }

  private loadOffsets(): OffsetState {
    try {
      const raw = fs.readFileSync(this.offsetPath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<OffsetState>;
      return { events: parsed.events ?? 0, tasks: parsed.tasks ?? 0 };
    } catch (error) {
      return { events: 0, tasks: 0 };
    }
  }

  private writeOffsets(state: OffsetState) {
    fs.writeFileSync(this.offsetPath, JSON.stringify(state, null, 2), 'utf-8');
  }

  private resetOffsets() {
    this.writeOffsets({ events: 0, tasks: 0 });
  }

  private ingestAll(): IndexResult {
    this.writeOffsets({ events: 0, tasks: 0 });
    return this.ingestFiles({ reset: true });
  }

  private ingestPartial(): IndexResult {
    return this.ingestFiles({ reset: false });
  }

  private ingestFiles(opts: { reset: boolean }): IndexResult {
    const offsets = this.loadOffsets();
    const eventsLines = this.readLines(this.eventsPath);
    const tasksLines = this.readLines(this.tasksPath);
    const eventsAdded = this.ingestEvents(eventsLines, opts.reset ? 0 : offsets.events);
    const tasksAdded = this.ingestTasks(tasksLines, opts.reset ? 0 : offsets.tasks);
    this.writeOffsets({ events: eventsLines.length, tasks: tasksLines.length });
    return { events: eventsAdded, tasks: tasksAdded };
  }

  private readLines(filePath: string): string[] {
    if (!fs.existsSync(filePath)) return [];
    return fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
  }

  private ingestEvents(lines: string[], start: number): number {
    if (start >= lines.length) return 0;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO events (id, ts, stream, type, severity, actor, correlation_id, summary, status, json)
      VALUES (@id, @ts, @stream, @type, @severity, @actor, @correlationId, @summary, @status, @json)
    `);
    let count = 0;
    for (let index = start; index < lines.length; index += 1) {
      try {
        const data = JSON.parse(lines[index]) as Record<string, unknown>;
        stmt.run({
          id: String(data.id ?? ''),
          ts: String(data.ts ?? ''),
          stream: String(data.stream ?? ''),
          type: String(data.type ?? ''),
          severity: String(data.severity ?? ''),
          actor: String(data.actor ?? ''),
          correlationId: String(data.correlationId ?? data.correlation_id ?? ''),
          summary: String(data.summary ?? ''),
          status: String(data.status ?? ''),
          json: JSON.stringify(data)
        });
        count += 1;
      } catch (error) {
        // skip invalid lines
      }
    }
    return count;
  }

  private ingestTasks(lines: string[], start: number): number {
    if (start >= lines.length) return 0;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO tasks (id, ts, stream, status, title, json)
      VALUES (@id, @ts, @stream, @status, @title, @json)
    `);
    let count = 0;
    for (let index = start; index < lines.length; index += 1) {
      try {
        const data = JSON.parse(lines[index]) as Record<string, unknown>;
        stmt.run({
          id: String(data.id ?? ''),
          ts: String(data.ts ?? ''),
          stream: String(data.stream ?? ''),
          status: String(data.status ?? ''),
          title: String(data.title ?? ''),
          json: JSON.stringify(data)
        });
        count += 1;
      } catch {
        // skip invalid entries
      }
    }
    return count;
  }
}
