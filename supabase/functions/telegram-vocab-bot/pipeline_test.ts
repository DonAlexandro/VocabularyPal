import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { processMessageBatch, summarize } from "./pipeline.ts";
import type { INotionService } from "./notion.ts";
import type { GptVocabulary } from "./types.ts";

function mockNotion(options: {
  existing?: Set<string>;
  failLookupFor?: string;
  failInsertFor?: string;
}): { created: string[]; notion: INotionService } {
  const created: string[] = [];
  return {
    created,
    notion: {
      existsByWord: (word: string): Promise<boolean> => {
        if (options.failLookupFor === word) {
          return Promise.reject(new Error("lookup fail"));
        }
        return Promise.resolve(
          options.existing?.has(word.toLocaleLowerCase()) ?? false,
        );
      },
      createWordRow: (row: GptVocabulary): Promise<void> => {
        if (options.failInsertFor === row.word) {
          return Promise.reject(new Error("insert fail"));
        }
        created.push(row.word);
        return Promise.resolve();
      },
    },
  };
}

Deno.test(
  "processMessageBatch continues after item-level failure and summarizes",
  async () => {
    const mock = mockNotion({
      existing: new Set(["apple"]),
      failInsertFor: "crash",
    });

    const enrichWord = (word: string): Promise<GptVocabulary> => {
      if (word === "badjson") {
        return Promise.reject(
          new Error("GPT response format validation failed"),
        );
      }
      if (word === "timeout") return Promise.reject(new Error("timeout"));
      return Promise.resolve({
        word,
        definition: `${word} def`,
        example: `${word} ex`,
      });
    };

    const results = await processMessageBatch(
      "apple\nbanana\nbadjson\ntimeout\ncrash\nbanana",
      { notion: mock.notion, enrichWord },
    );

    const summary = summarize(results);
    assertEquals(summary.created, 1);
    assertEquals(summary.skipped, 2);
    assertEquals(summary.failed, 3);
    assertEquals(mock.created, ["banana"]);
  },
);

Deno.test(
  "processMessageBatch stores original user phrase in Notion Word",
  async () => {
    const insertedRows: GptVocabulary[] = [];

    const notion: INotionService = {
      existsByWord: (_word: string): Promise<boolean> => Promise.resolve(false),
      createWordRow: (row: GptVocabulary): Promise<void> => {
        insertedRows.push(row);
        return Promise.resolve();
      },
    };

    const enrichWord = (_word: string): Promise<GptVocabulary> =>
      Promise.resolve({
        word: "chop-chop",
        definition: "to hurry",
        example: "Chop-chop, we are late.",
      });

    await processMessageBatch("don't chop-chop me", { notion, enrichWord });

    assertEquals(insertedRows.length, 1);
    assertEquals(insertedRows[0].word, "don't chop-chop me");
    assertEquals(insertedRows[0].definition, "to hurry");
    assertEquals(insertedRows[0].example, "Chop-chop, we are late.");
  },
);
