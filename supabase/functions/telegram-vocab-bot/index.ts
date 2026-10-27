import { createDefaultPipelineDeps, processMessageBatch, summarize } from "./pipeline.ts";
import {
  answerTelegramCallbackQuery,
  sendTelegramMessage,
  TELEGRAM_RETRY_CALLBACK_DATA,
} from "./telegram.ts";
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
    message_id?: number;
    text?: string;
    chat?: { id?: number };
  };
  callback_query?: {
    id: string;
    data?: string;
    message?: {
      chat?: { id?: number };
      reply_to_message?: {
        message_id?: number;
        text?: string;
      };
    };
  };
};

const HTTP_OK = 200;
const HTTP_UNAUTHORIZED = 401;
const HTTP_METHOD_NOT_ALLOWED = 405;
const DEFAULT_PORT = 8000;
const GEMINI_BUSY_MESSAGE =
  "Gemini is experiencing high demand right now. Please wait a moment, then tap “Try again”.";

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
    if (failure.phase === "gpt_unavailable") continue;
    lines.push(`- ${failure.input}: ${failure.phase} (${failure.reason})`);
  }
  return lines.join("\n");
}

type ProgressEvent = {
  stage: string;
  item?: string;
  index?: number;
  total?: number;
  phase?: string;
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
      if (event.phase === "gpt_unavailable") {
        return "Gemini is temporarily busy. Please wait a moment.";
      }
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

type VocabularyMessageInput = {
  botToken: string;
  chatId: number;
  messageId?: number;
  text: string;
  notionApiKey: string;
  notionDatabaseId: string;
  geminiModel: string;
};

const processVocabularyMessage = async ({
  botToken,
  chatId,
  messageId,
  text,
  notionApiKey,
  notionDatabaseId,
  geminiModel,
}: VocabularyMessageInput): Promise<void> => {
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
      { replyToMessageId: messageId },
    );
    return;
  }

  for (const failed of summary.failures) {
    await sendTelegramMessage(
      botToken,
      chatId,
      failed.phase === "gpt_unavailable"
        ? GEMINI_BUSY_MESSAGE
        : `Failed '${failed.input}': ${failed.phase}. ${failed.reason}`,
      {
        replyToMessageId: messageId,
        showRetryButton: failed.phase === "gpt_unavailable",
      },
    );
  }
  await sendTelegramMessage(botToken, chatId, formatSummary(results));
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
  const allowedChatId = Deno.env.get("ALLOWED_CHAT_ID");
  const callback = body.callback_query;
  if (callback) {
    await answerTelegramCallbackQuery(botToken, callback.id);
    const retryMessage = callback.message?.reply_to_message;
    const chatId = callback.message?.chat?.id;
    if (
      callback.data !== TELEGRAM_RETRY_CALLBACK_DATA || !chatId ||
      !retryMessage?.text
    ) {
      return new Response("ok", { status: HTTP_OK });
    }
    if (!isAllowedChat(chatId, allowedChatId)) {
      console.log(`ignored retry from chatId=${chatId}: not in allowlist`);
      return new Response("ok", { status: HTTP_OK });
    }
    console.log(`retry requested chatId=${chatId}`);
    await processVocabularyMessage({
      botToken,
      chatId,
      messageId: retryMessage.message_id,
      text: retryMessage.text,
      notionApiKey,
      notionDatabaseId,
      geminiModel,
    });
    return new Response("ok", { status: HTTP_OK });
  }

  const chatId = body.message?.chat?.id;
  const text = body.message?.text;
  if (!chatId || !text) {
    console.log("ignored update without text message");
    return new Response("ok", { status: HTTP_OK });
  }
  if (!isAllowedChat(chatId, allowedChatId)) {
    // silent 200: avoids Telegram retry loop
    console.log(`ignored message from chatId=${chatId}: not in allowlist`);
    return new Response("ok", { status: HTTP_OK });
  }

  console.log(`received message chatId=${chatId} textLength=${text.length}`);
  await processVocabularyMessage({
    botToken,
    chatId,
    messageId: body.message?.message_id,
    text,
    notionApiKey,
    notionDatabaseId,
    geminiModel,
  });

  return new Response("ok", { status: HTTP_OK });
});
