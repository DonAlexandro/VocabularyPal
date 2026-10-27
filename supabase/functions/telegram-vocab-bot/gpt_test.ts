import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { enrichWordWithGpt, formatDefinitions } from "./gpt.ts";
import { gptEnrichmentResponseSchema, gptVocabularySchema } from "./schema.ts";

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

Deno.test("formatDefinitions separates meanings with blank lines around OR", () => {
  assertEquals(
    formatDefinitions([
      "The loud, sharp sound a dog makes.",
      "The hard outer layer of a tree trunk.",
    ]),
    "The loud, sharp sound a dog makes.\n\nOR\n\nThe hard outer layer of a tree trunk.",
  );
});

Deno.test("formatDefinitions removes numbering from Gemini meanings", () => {
  assertEquals(
    formatDefinitions([
      "1. The loud, sharp sound a dog makes. OR 2. The hard outer layer of a tree trunk.",
    ]),
    "The loud, sharp sound a dog makes.\n\nOR\n\nThe hard outer layer of a tree trunk.",
  );
  assertEquals(
    formatDefinitions([
      "1. The loud, sharp sound a dog makes.",
      "2. The hard outer layer of a tree trunk.",
    ]),
    "The loud, sharp sound a dog makes.\n\nOR\n\nThe hard outer layer of a tree trunk.",
  );
});

Deno.test("gptEnrichmentResponseSchema limits meanings to three", () => {
  assertEquals(
    gptEnrichmentResponseSchema.safeParse({
      word: "bark",
      meanings: ["sound", "tree covering", "boat"],
      example: "The dog barked.",
    }).success,
    true,
  );
  assertEquals(
    gptEnrichmentResponseSchema.safeParse({
      word: "bark",
      meanings: ["one", "two", "three", "four"],
      example: "The dog barked.",
    }).success,
    false,
  );
});
