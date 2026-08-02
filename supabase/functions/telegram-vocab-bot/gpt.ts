import { chat } from "npm:@tanstack/ai";
import { geminiText } from "npm:@tanstack/ai-gemini";
import { gptEnrichInputSchema, gptVocabularySchema } from "./schema.ts";
import type { GptVocabulary } from "./types.ts";

const buildPrompt = (word: string): string =>
  [
    "Return a single JSON object with keys: word, definition, example.",
    "No markdown, no arrays.",
    "Define the word exactly as given — do not normalize to base/infinitive form.",
    "If the input is 'hunkered', define 'hunkered' as adjective/past-tense, not 'hunker' as a verb.",
    "Write definition and example for a 16-year-old non-native English learner: clear, everyday words, no jargon, short sentences, one concrete example sentence.",
    `Input: ${word}`,
  ].join("\n");

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
    messages: [{ role: "user", content: buildPrompt(input.word) }],
    modelOptions,
    outputSchema: gptVocabularySchema,
  };
  // deno-lint-ignore no-explicit-any
  return (await chat(chatOptions as any)) as unknown as GptVocabulary;
}
