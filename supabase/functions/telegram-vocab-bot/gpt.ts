import { chat } from "npm:@tanstack/ai";
import { geminiText } from "npm:@tanstack/ai-gemini";
import { gptEnrichInputSchema, gptEnrichmentResponseSchema } from "./schema.ts";
import type { GptVocabulary } from "./types.ts";

const buildPrompt = (word: string): string =>
  [
    "Define the word exactly as given — do not normalize to base/infinitive form.",
    "If the input is 'hunkered', define 'hunkered' as adjective/past-tense, not 'hunker' as a verb.",
    "Give up to three distinct meanings that apply, ordered by frequency in general everyday English. Return only applicable meanings; do not invent meanings to reach three.",
    "Write concise definitions and one example for a 23-year-old non-native English learner: clear, everyday words, no jargon, short sentences.",
    `Input: ${word}`,
  ].join("\n");

export const formatDefinitions = (meanings: string[]): string =>
  meanings
    .flatMap((meaning) => meaning.split(/\s+OR\s+(?=\d+[.)]\s+)/))
    .map((meaning) => meaning.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean)
    .join("\n\nOR\n\n");

export async function enrichWordWithGpt(
  word: string,
  model: string,
): Promise<GptVocabulary> {
  const input = gptEnrichInputSchema.parse({ word });
  // deno-lint-ignore no-explicit-any
  const adapter = geminiText(model as any);
  // ponytail: casts bridge adapter type gap; tighten once SDK API stabilizes.
  // deno-lint-ignore no-explicit-any
  const modelOptions = {
    temperature: 0,
    responseMimeType: "application/json",
  } as any;
  const chatOptions = {
    adapter,
    threadId: crypto.randomUUID(),
    messages: [{ role: "user", content: buildPrompt(input.word) }],
    modelOptions,
    outputSchema: gptEnrichmentResponseSchema,
  };
  // deno-lint-ignore no-explicit-any
  const result = gptEnrichmentResponseSchema.parse(
    // deno-lint-ignore no-explicit-any
    await chat(chatOptions as any),
  );
  return {
    word: result.word,
    definition: formatDefinitions(result.meanings),
    example: result.example,
  };
}
