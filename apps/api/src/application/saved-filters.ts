import { z } from 'zod';

export const SavedFilterSchema = z.object({
  // Using name as a stable identifier (UI doesn't generate ids)
  name: z.string(),
  stream: z.string().default(''),
  type: z.string().default(''),
  status: z.string().default(''),
  limit: z.number().int().min(1).max(500).default(25),
  query: z.string().default('')
});

export type SavedFilter = z.infer<typeof SavedFilterSchema>;

export type SavedFilterRepositoryPort = {
  readAll: () => SavedFilter[];
  writeAll: (items: SavedFilter[]) => void;
};

export class SavedFilterService {
  constructor(private readonly repo: SavedFilterRepositoryPort) {}

  list() {
    return { items: this.repo.readAll() };
  }

  save(payload: unknown) {
    const parsed = SavedFilterSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.flatten() };
    }

    const items = this.repo.readAll();
    const next = items.filter((f) => f.name.toLowerCase() !== parsed.data.name.toLowerCase());
    next.unshift(parsed.data);
    this.repo.writeAll(next.slice(0, 100));
    return { success: true as const };
  }

  remove(name: string) {
    const items = this.repo.readAll();
    const next = items.filter((f) => f.name.toLowerCase() !== name.toLowerCase());
    this.repo.writeAll(next);
    return { success: true as const };
  }
}
