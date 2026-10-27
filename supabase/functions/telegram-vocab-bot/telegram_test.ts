import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createTelegramMessagePayload } from "./telegram.ts";

Deno.test("retry message includes inline button and replies to failed input", () => {
  assertEquals(
    createTelegramMessagePayload(123, "Gemini busy.", {
      replyToMessageId: 456,
      showRetryButton: true,
    }),
    {
      chat_id: 123,
      text: "Gemini busy.",
      reply_to_message_id: 456,
      reply_markup: {
        inline_keyboard: [[{
          text: "Try again",
          callback_data: "retry",
        }]],
      },
    },
  );
});
