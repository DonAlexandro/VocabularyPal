import { parseVocabularyLines } from "./parseMessage.ts";
import { type INotionService, NotionService } from "./notion.ts";
import { enrichWordWithGpt } from "./gpt.ts";
import type { ItemResult, Summary } from "./types.ts";

type ProgressStage =
  | "batch_start"
  | "same_message_duplicate"
  | "duplicate_check"
  | "gpt_enrich"
  | "notion_insert"
  | "item_created"
  | "item_skipped"
  | "item_failed";

type ProgressEvent = {
  stage: ProgressStage;
  item?: string;
  index?: number;
  total?: number;
  reason?: string;
};

type PipelineDeps = {
  notion: INotionService;
  enrichWord: (
    word: string,
  ) => Promise<{ word: string; definition: string; example: string }>;
  reportProgress?: (event: ProgressEvent) => Promise<void>;
};

export function summarize(results: ItemResult[]): Summary {
  const created = results.filter((r) => r.status === "created").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failedItems = results.filter(
    (r): r is Extract<ItemResult, { status: "failed" }> =>
      r.status === "failed",
  );

  return {
    created,
    skipped,
    failed: failedItems.length,
    failures: failedItems.map((f) => ({
      input: f.input,
      phase: f.phase,
      reason: f.reason,
    })),
  };
}

function stripError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "unknown error";
}

const reportProgress = async (
  deps: PipelineDeps,
  event: ProgressEvent,
): Promise<void> => {
  if (!deps.reportProgress) return;
  await deps.reportProgress(event);
};

export async function processMessageBatch(
  rawText: string,
  deps: PipelineDeps,
): Promise<ItemResult[]> {
  const parsed = parseVocabularyLines(rawText);

  await reportProgress(deps, {
    stage: "batch_start",
    total: parsed.items.length,
  });

  const preSkipped: ItemResult[] = parsed.skippedInMessage.map((line) => ({
    status: "skipped",
    input: line,
    reason: "duplicate in same message",
  }));

  for (const line of parsed.skippedInMessage) {
    await reportProgress(deps, {
      stage: "same_message_duplicate",
      item: line,
      reason: "duplicate in same message",
    });
  }

  const results: ItemResult[] = [...preSkipped];

  for (const [index, item] of parsed.items.entries()) {
    const step = index + 1;
    const total = parsed.items.length;

    await reportProgress(deps, {
      stage: "duplicate_check",
      item,
      index: step,
      total,
    });

    try {
      const exists = await deps.notion.existsByWord(item);
      if (exists) {
        results.push({
          status: "skipped",
          input: item,
          reason: "already exists",
        });

        await reportProgress(deps, {
          stage: "item_skipped",
          item,
          index: step,
          total,
          reason: "already exists",
        });

        continue;
      }
    } catch (error) {
      const reason = stripError(error);
      results.push({
        status: "failed",
        input: item,
        phase: "notion_lookup",
        reason,
      });

      await reportProgress(deps, {
        stage: "item_failed",
        item,
        index: step,
        total,
        reason: `notion_lookup: ${reason}`,
      });

      continue;
    }

    await reportProgress(deps, {
      stage: "gpt_enrich",
      item,
      index: step,
      total,
    });

    let gpt;
    try {
      gpt = await deps.enrichWord(item);
    } catch (error) {
      const msg = stripError(error);
      const phase = msg.includes("format validation failed")
        ? "gpt_validation"
        : "gpt_request";
      results.push({ status: "failed", input: item, phase, reason: msg });

      await reportProgress(deps, {
        stage: "item_failed",
        item,
        index: step,
        total,
        reason: `${phase}: ${msg}`,
      });

      continue;
    }

    await reportProgress(deps, {
      stage: "notion_insert",
      item,
      index: step,
      total,
    });

    try {
      await deps.notion.createWordRow({
        word: item,
        definition: gpt.definition,
        example: gpt.example,
      });
      results.push({ status: "created", input: item, savedWord: item });

      await reportProgress(deps, {
        stage: "item_created",
        item,
        index: step,
        total,
      });
    } catch (error) {
      const reason = stripError(error);
      results.push({
        status: "failed",
        input: item,
        phase: "notion_insert",
        reason,
      });

      await reportProgress(deps, {
        stage: "item_failed",
        item,
        index: step,
        total,
        reason: `notion_insert: ${reason}`,
      });
    }
  }

  return results;
}

export function createDefaultPipelineDeps(env: {
  notionApiKey: string;
  notionDatabaseId: string;
  geminiModel: string;
}): PipelineDeps {
  const notion = new NotionService(env.notionApiKey, env.notionDatabaseId);
  const enrichWord = (word: string) => enrichWordWithGpt(word, env.geminiModel);
  return { notion, enrichWord };
}
