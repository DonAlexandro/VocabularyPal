import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { gptVocabularyArraySchema } from "./schema.ts";

Deno.test("gptVocabularyArraySchema accepts one valid object", () => {
  const valid = gptVocabularyArraySchema.safeParse([
    { word: "apple", definition: "a fruit", example: "I ate an apple." },
  ]);
  assertEquals(valid.success, true);
});

Deno.test("gptVocabularyArraySchema rejects invalid payload", () => {
  const invalid = gptVocabularyArraySchema.safeParse([{ word: "apple" }]);
  assertEquals(invalid.success, false);
});
