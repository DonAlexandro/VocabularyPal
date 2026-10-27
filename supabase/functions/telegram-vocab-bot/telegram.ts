export type TelegramMessageOptions = {
  replyToMessageId?: number;
  showRetryButton?: boolean;
};

export const TELEGRAM_RETRY_CALLBACK_DATA = "retry";

export const createTelegramMessagePayload = (
  chatId: number,
  text: string,
  options: TelegramMessageOptions = {},
) => ({
  chat_id: chatId,
  text,
  ...(options.replyToMessageId && {
    reply_to_message_id: options.replyToMessageId,
  }),
  ...(options.showRetryButton && {
    reply_markup: {
      inline_keyboard: [[{
        text: "Try again",
        callback_data: TELEGRAM_RETRY_CALLBACK_DATA,
      }]],
    },
  }),
});

export async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string,
  options: TelegramMessageOptions = {},
): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createTelegramMessagePayload(chatId, text, options)),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram sendMessage failed: ${response.status} ${body}`);
  }
}

export async function answerTelegramCallbackQuery(
  botToken: string,
  callbackQueryId: string,
): Promise<void> {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/answerCallbackQuery`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId }),
    },
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Telegram answerCallbackQuery failed: ${response.status} ${body}`,
    );
  }
}
