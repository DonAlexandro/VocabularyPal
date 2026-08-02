import * as R from "npm:remeda@2.39.0";

export const normalizeWord = (value: string): string =>
  value.trim().toLocaleLowerCase();

export type ParsedBatch = {
  items: string[];
  skippedInMessage: string[];
};

export function parseVocabularyLines(rawText: string): ParsedBatch {
  const lines = R.pipe(
    rawText.split("\n"),
    R.map((line: string) => line.trim()),
    R.filter((line: string) => line.length > 0),
  );

  const seen = new Set<string>();
  const items: string[] = [];
  const skippedInMessage: string[] = [];

  for (const line of lines) {
    const key = normalizeWord(line);
    if (seen.has(key)) {
      skippedInMessage.push(line);
      continue;
    }
    seen.add(key);
    items.push(line);
  }

  return { items, skippedInMessage };
}
