import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { normalizeWord, parseVocabularyLines } from "./parseMessage.ts";

Deno.test(
  "normalizeWord trims and lowercases without collapsing inner spaces",
  () => {
    assertEquals(normalizeWord("  Phrasal   Verb  "), "phrasal   verb");
  },
);

Deno.test(
  "parseVocabularyLines ignores blank lines and skips same-message duplicates",
  () => {
    const parsed = parseVocabularyLines(
      "\n  Apple\n\napple\npear\n PEAR \n\t\n",
    );

    assertEquals(parsed.items, ["Apple", "pear"]);
    assertEquals(parsed.skippedInMessage, ["apple", "PEAR"]);
  },
);
