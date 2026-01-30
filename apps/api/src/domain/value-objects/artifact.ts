import { z } from 'zod';

export const ArtifactSchema = z.object({
  kind: z.string(),
  value: z.string()
});
export type Artifact = z.infer<typeof ArtifactSchema>;
