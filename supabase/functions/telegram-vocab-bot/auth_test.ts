import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isAllowedChat, isWebhookValid } from "./auth.ts";

Deno.test("isWebhookValid accepts matching secret", () => {
  const req = new Request("https://example.com", {
    headers: { "X-Telegram-Bot-Api-Secret-Token": "mysecret" },
  });
  assertEquals(isWebhookValid(req, "mysecret"), true);
});

Deno.test("isWebhookValid rejects wrong secret", () => {
  const req = new Request("https://example.com", {
    headers: { "X-Telegram-Bot-Api-Secret-Token": "wrong" },
  });
  assertEquals(isWebhookValid(req, "mysecret"), false);
});

Deno.test("isWebhookValid rejects missing header", () => {
  const req = new Request("https://example.com");
  assertEquals(isWebhookValid(req, "mysecret"), false);
});

Deno.test(
  "isAllowedChat allows all when ALLOWED_CHAT_ID not configured",
  () => {
    assertEquals(isAllowedChat(123, undefined), true);
    assertEquals(isAllowedChat(999, undefined), true);
  },
);

Deno.test("isAllowedChat restricts to configured chatId", () => {
  assertEquals(isAllowedChat(123, "123"), true);
  assertEquals(isAllowedChat(456, "123"), false);
});
