import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { enrichWordWithGpt } from "./gpt.ts";
import { gptVocabularySchema } from "./schema.ts";

// Validates schema validation fires before any network call — no API key needed.
Deno.test(
  "enrichWordWithGpt rejects empty word before calling API",
  async () => {
    await assertRejects(() => enrichWordWithGpt("", "gemini-2.5-flash-lite"));
  },
);

Deno.test("gptVocabularySchema accepts valid structured output", () => {
  const result = gptVocabularySchema.safeParse({
    word: "hunkered",
    definition: "bent close to the ground",
    example: "She was hunkered behind a rock.",
  });
  assertEquals(result.success, true);
});

Deno.test("gptVocabularySchema rejects output missing required fields", () => {
  assertEquals(gptVocabularySchema.safeParse({ word: "x" }).success, false);
  assertEquals(
    gptVocabularySchema.safeParse({ word: "", definition: "d", example: "e" })
      .success,
    false,
  );
});
