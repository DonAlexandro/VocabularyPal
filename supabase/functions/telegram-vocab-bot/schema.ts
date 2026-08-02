// @ts-ignore: resolved by Deno import map/runtime.
import { z } from "npm:zod";

export const gptEnrichInputSchema = z.object({
  word: z.string().min(1),
});

export const gptVocabularySchema = z.object({
  word: z.string().min(1),
  definition: z.string().min(1),
  example: z.string().min(1),
});

export const gptVocabularyArraySchema = z.array(gptVocabularySchema).length(1);

export const gptEnrichOutputSchema = gptVocabularyArraySchema;

export type GptVocabularySchema = z.infer<typeof gptVocabularySchema>;
