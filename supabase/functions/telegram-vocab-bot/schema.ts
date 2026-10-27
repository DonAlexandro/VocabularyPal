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

const MAX_DEFINITION_MEANINGS = 3;

export const gptEnrichmentResponseSchema = z.object({
  word: z.string().min(1).describe("The submitted word or phrase."),
  meanings: z.array(
    z.string().min(1).describe("One concise, distinct definition of the input."),
  ).min(1).max(MAX_DEFINITION_MEANINGS).describe(
    "Applicable meanings, ordered from most to least frequent in general everyday English.",
  ),
  example: z.string().min(1).describe(
    "One short concrete example sentence using the submitted word or phrase.",
  ),
});

export const gptVocabularyArraySchema = z.array(gptVocabularySchema).length(1);

export const gptEnrichOutputSchema = gptVocabularyArraySchema;

export type GptVocabularySchema = z.infer<typeof gptVocabularySchema>;
