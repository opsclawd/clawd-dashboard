import fs from 'node:fs';
import path from 'node:path';
import type { ArtifactRepositoryPort } from '../../application/artifacts';
import { walkFiles } from '../file-system';

const EXTRA_FILES = ['job-search.md', 'job-search.md', 'README.md'];

export class ArtifactRepository implements ArtifactRepositoryPort {
  private readonly root: string;
  private readonly streamsPath: string;

  constructor(root: string, streamsPath: string) {
    this.root = root;
    this.streamsPath = streamsPath;
  }

  fetchAll() {
    const streamEntries = walkFiles(this.streamsPath, this.root).map((entry) => ({
      ...entry,
      kind: 'stream' as const
    }));

    const extras = EXTRA_FILES
      .map((relativePath) => path.join(this.root, relativePath))
      .filter((candidate) => fs.existsSync(candidate))
      .map((candidate) => ({
        path: path.relative(this.root, candidate),
        mtimeMs: fs.statSync(candidate).mtimeMs,
        kind: 'file' as const
      }));

    return [...streamEntries, ...extras];
  }
}
