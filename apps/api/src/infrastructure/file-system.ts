import fs from 'node:fs';
import path from 'node:path';

export type FileEntry = { path: string; mtimeMs: number };

export const readJsonLines = <T = unknown>(filePath: string): T[] => {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
  const items: T[] = [];
  for (const line of lines) {
    try {
      items.push(JSON.parse(line) as T);
    } catch {
      // skip malformed lines
    }
  }
  return items;
};

export const appendJsonLine = (filePath: string, data: string) => {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });
  fs.appendFileSync(filePath, `${data}\n`, 'utf-8');
};

export const walkFiles = (dir: string, base = dir): FileEntry[] => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out: FileEntry[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(full, base));
    } else {
      const stat = fs.statSync(full);
      out.push({ path: path.relative(base, full), mtimeMs: stat.mtimeMs });
    }
  }
  return out;
};
