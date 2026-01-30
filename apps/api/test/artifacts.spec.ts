import { describe, it, expect } from 'vitest';
import { ArtifactService } from '../src/application/artifacts';
import { ArtifactRepository } from '../src/infrastructure/repositories/artifact-repository';

class DummyRepo extends ArtifactRepository {
  constructor() {
    super('', '');
  }
  fetchAll() {
    return [
      { path: 'a', mtimeMs: 1, kind: 'stream' as const },
      { path: 'b', mtimeMs: 5, kind: 'file' as const }
    ];
  }
}

describe('ArtifactService', () => {
  it('returns artifacts sorted desc', () => {
    const service = new ArtifactService(new DummyRepo());
    const result = service.listArtifacts();
    expect(result.items[0].mtimeMs).toBe(5);
  });
});
