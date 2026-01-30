export type ArtifactItem = { path: string; mtimeMs: number; kind: 'stream' | 'file' };

export type ArtifactRepositoryPort = {
  fetchAll: () => ArtifactItem[];
};

export class ArtifactService {
  private readonly repository: ArtifactRepositoryPort;

  constructor(repository: ArtifactRepositoryPort) {
    this.repository = repository;
  }

  listArtifacts() {
    const items = [...this.repository.fetchAll()];
    const ordered = items.sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, 200);
    return { items: ordered };
  }
}
