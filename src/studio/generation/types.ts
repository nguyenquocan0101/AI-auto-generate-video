import { z } from "zod";
import type { StudioDocument, StudioRenderer } from "../contracts.js";

export const GenerationProviderSchema = z.enum(["local", "openai", "claude", "gemini"]);
export type GenerationProvider = z.infer<typeof GenerationProviderSchema>;

export const GenerationMetadataSchema = z.object({
  provider: GenerationProviderSchema,
  model: z.string().min(1).optional(),
  requestId: z.string().min(1).optional(),
}).strict();

export const GenerationSourceSchema = z.object({
  kind: z.enum(["topic", "url"]),
  value: z.string().min(1),
}).strict();
export type GenerationSource = z.infer<typeof GenerationSourceSchema>;

export interface GenerationInput {
  source: GenerationSource;
  renderer: StudioRenderer;
}

export interface EphemeralCredentials {
  apiKey?: string;
  model?: string;
}

export interface GenerationMetadata {
  provider: GenerationProvider;
  model?: string;
  requestId?: string;
}

export interface GenerationResult {
  document: StudioDocument;
  metadata: GenerationMetadata;
}

export interface LessonGenerationAdapter {
  readonly provider: GenerationProvider;
  generate(input: GenerationInput, credentials: EphemeralCredentials): Promise<GenerationResult>;
}
