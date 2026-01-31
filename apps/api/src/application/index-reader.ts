import Database from 'better-sqlite3';
import path from 'node:path';

export class IndexReader {
  private db: Database.Database;

  constructor(private readonly rootDir: string) {
    const dbPath = path.join(this.rootDir, 'data', 'index.sqlite');
    this.db = new Database(dbPath, { readonly: true, fileMustExist: false });
  }

  listEvents(params: {
    stream?: string;
    type?: string;
    status?: string;
    q?: string;
    limit: number;
    offset: number;
  }) {
    const where: string[] = [];
    const bind: Record<string, unknown> = {};

    if (params.stream) {
      where.push('stream = @stream');
      bind.stream = params.stream;
    }
    if (params.type) {
      where.push('type = @type');
      bind.type = params.type;
    }
    if (params.status) {
      where.push('status = @status');
      bind.status = params.status;
    }
    if (params.q) {
      where.push('summary LIKE @q');
      bind.q = `%${params.q}%`;
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const totalStmt = this.db.prepare(`SELECT COUNT(*) as total FROM events ${whereClause}`);
    const total = totalStmt.get(bind) as { total: number };

    const stmt = this.db.prepare(
      `SELECT json FROM events ${whereClause} ORDER BY ts DESC LIMIT @limit OFFSET @offset`
    );
    const rows = stmt.all({ ...bind, limit: params.limit, offset: params.offset }) as { json: string }[];
    const items = rows.map((row) => JSON.parse(row.json));

    return { items, total: total.total, limit: params.limit, offset: params.offset };
  }
}
