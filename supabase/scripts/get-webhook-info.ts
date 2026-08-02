const TELEGRAM_API_BASE = "https://api.telegram.org/bot";
const WEBHOOK_INFO_PATH = "getWebhookInfo";
const HTTP_OK_MIN = 200;
const HTTP_OK_MAX = 299;
const EXIT_FAILURE = 1;

export {};

type DenoLike = {
  env: { get: (name: string) => string | undefined };
  exit: (code?: number) => never;
};

const deno = (globalThis as unknown as { Deno: DenoLike }).Deno;

const getRequiredEnv = (name: string): string => {
  const value = deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
};

const main = async (): Promise<void> => {
  const botToken = getRequiredEnv("TELEGRAM_BOT_TOKEN");
  const url = `${TELEGRAM_API_BASE}${botToken}/${WEBHOOK_INFO_PATH}`;

  const response = await fetch(url);
  const body = await response.text();

  console.log(body);

  if (response.status < HTTP_OK_MIN || response.status > HTTP_OK_MAX) {
    deno.exit(response.status || EXIT_FAILURE);
  }
};

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  deno.exit(EXIT_FAILURE);
}
