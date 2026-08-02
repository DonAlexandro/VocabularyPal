export const isWebhookValid = (req: Request, secret: string): boolean => {
  const actual = req.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
  return actual.length > 0 && actual === secret;
};

// When ALLOWED_CHAT_ID is set, only that chat is processed; prevents unauthorized use.
export const isAllowedChat = (
  chatId: number,
  allowedChatId: string | undefined,
): boolean => !allowedChatId || chatId === Number(allowedChatId);
