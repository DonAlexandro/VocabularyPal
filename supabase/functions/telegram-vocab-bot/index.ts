import { createDefaultPipelineDeps, processMessageBatch, summarize } from "./pipeline.ts";
import { sendTelegramMessage } from "./telegram.ts";
import { isAllowedChat, isWebhookValid } from "./auth.ts";
import type { ItemResult } from "./types.ts";

declare const Deno: {
  env: { get: (name: string) => string | undefined };
  serve: (
    options: { port: number },
    handler: (req: Request) => Response | Promise<Response>,
  ) => void;
};

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number };
  };
};

const HTTP_OK = 200;
const HTTP_UNAUTHORIZED = 401;
const HTTP_METHOD_NOT_ALLOWED = 405;
const DEFAULT_PORT = 8000;

const getPort = (): number => {
  const raw = Deno.env.get("PORT")?.trim();
  if (!raw) return DEFAULT_PORT;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
};

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

function formatSummary(items: ItemResult[]): string {
  const results = summarize(items);
  const lines = [
    `Created: ${results.created}`,
    `Skipped: ${results.skipped}`,
    `Failed: ${results.failed}`,
  ];
  for (const item of items) {
    if (item.status === "created") {
      lines.push(`- ${item.savedWord}: ${item.notionUrl}`);
    }
  }
  for (const failure of results.failures) {
    lines.push(`- ${failure.input}: ${failure.phase} (${failure.reason})`);
  }
  return lines.join("\n");
}

type ProgressEvent = {
  stage: string;
  item?: string;
  index?: number;
  total?: number;
  reason?: string;
};

const formatProgress = (event: ProgressEvent): string => {
  const item = event.item ? `'${event.item}'` : "";

  switch (event.stage) {
    case "batch_start":
      return `Processing started. Items: ${event.total ?? 0}`;
    case "same_message_duplicate":
      return `Skipped ${item}: duplicate in same message.`;
    case "duplicate_check":
      return `Checking duplicate ${item}`;
    case "gpt_enrich":
      return `Enriching with AI ${item}`;
    case "notion_insert":
      return `Saving to Notion ${item}`;
    case "item_skipped":
      return `Skipped ${item}: ${event.reason ?? "skipped"}.`;
    case "item_failed":
      return `Failed ${item}: ${event.reason ?? "unknown error"}.`;
    default:
      return `${event.stage} ${item}`.trim();
  }
};

const sendProgressMessage = async (
  botToken: string,
  chatId: number,
  event: ProgressEvent,
): Promise<void> => {
  try {
    await sendTelegramMessage(botToken, chatId, formatProgress(event));
  } catch (error) {
    console.log(
      `progress message failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

const port = getPort();
console.log(`telegram-vocab-bot listening on :${port}`);

Deno.serve({ port }, async (req: Request) => {
  if (req.method !== "POST") {
    console.log(`ignored request method=${req.method}`);
    return new Response("Method Not Allowed", {
      status: HTTP_METHOD_NOT_ALLOWED,
    });
  }

  const webhookSecret = getRequiredEnv("TELEGRAM_WEBHOOK_SECRET");
  if (!isWebhookValid(req, webhookSecret)) {
    console.log("rejected webhook: invalid secret header");
    return new Response("Unauthorized", { status: HTTP_UNAUTHORIZED });
  }

  const botToken = getRequiredEnv("TELEGRAM_BOT_TOKEN");
  const notionApiKey = getRequiredEnv("NOTION_API_KEY");
  const notionDatabaseId = getRequiredEnv("NOTION_DATABASE_ID");
  const geminiModel = getRequiredEnv("GEMINI_MODEL");

  const body = (await req.json()) as TelegramUpdate;
  const chatId = body.message?.chat?.id;
  const text = body.message?.text;

  if (!chatId || !text) {
    console.log("ignored update without text message");
    return new Response("ok", { status: HTTP_OK });
  }

  const allowedChatId = Deno.env.get("ALLOWED_CHAT_ID");
  if (!isAllowedChat(chatId, allowedChatId)) {
    // silent 200: avoids Telegram retry loop
    console.log(`ignored message from chatId=${chatId}: not in allowlist`);
    return new Response("ok", { status: HTTP_OK });
  }

  console.log(`received message chatId=${chatId} textLength=${text.length}`);

  const deps = createDefaultPipelineDeps({
    notionApiKey,
    notionDatabaseId,
    geminiModel,
  });

  const results = await processMessageBatch(text, {
    ...deps,
    reportProgress: (event) => sendProgressMessage(botToken, chatId, event),
  });

  const summary = summarize(results);

  const firstResult = results.length === 1 ? results[0] : undefined;
  if (firstResult?.status === "created") {
    await sendTelegramMessage(
      botToken,
      chatId,
      `Saved: ${firstResult.savedWord}\n${firstResult.notionUrl}`,
    );
    console.log("reply sent: single created");
  } else {
    for (const failed of summary.failures) {
      await sendTelegramMessage(
        botToken,
        chatId,
        `Failed '${failed.input}': ${failed.phase}. ${failed.reason}`,
      );
    }
    await sendTelegramMessage(botToken, chatId, formatSummary(results));
    console.log(
      `reply sent: created=${summary.created} skipped=${summary.skipped} failed=${summary.failed}`,
    );
  }

  return new Response("ok", { status: HTTP_OK });
});
