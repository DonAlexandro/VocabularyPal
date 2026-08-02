const TELEGRAM_API_BASE = "https://api.telegram.org/bot";
const SUPABASE_DOMAIN = "supabase.co";
const FUNCTION_PATH = "functions/v1/telegram-vocab-bot";
const MODE_LOCAL = "local";
const MODE_PRODUCTION = "production";
const EXIT_FAILURE = 1;

export {};

type DenoLike = {
  args: string[];
  env: { get: (name: string) => string | undefined };
  Command: new (
    command: string,
    options: {
      args: string[];
      stdout: "piped" | "inherit" | "null";
      stderr: "piped" | "inherit" | "null";
    },
  ) => {
    output: () => Promise<{
      stdout: Uint8Array;
      stderr: Uint8Array;
      success: boolean;
      code: number;
    }>;
  };
  exit: (code?: number) => never;
};

const deno = (globalThis as unknown as { Deno: DenoLike }).Deno;

type WebhookMode = typeof MODE_LOCAL | typeof MODE_PRODUCTION;

const getRequiredEnv = (name: string): string => {
  const value = deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
};

const getMode = (): WebhookMode => {
  const raw = deno.args[0]?.trim().toLowerCase();
  if (!raw || raw === MODE_PRODUCTION) return MODE_PRODUCTION;
  if (raw === MODE_LOCAL) return MODE_LOCAL;
  throw new Error(
    `Unsupported mode: ${raw}. Use '${MODE_LOCAL}' or '${MODE_PRODUCTION}'.`,
  );
};

const getWebhookUrl = (mode: WebhookMode): string => {
  if (mode === MODE_LOCAL) {
    return getRequiredEnv("LOCAL_WEBHOOK_URL");
  }

  const projectRef = getRequiredEnv("PROJECT_REF");
  return `https://${projectRef}.${SUPABASE_DOMAIN}/${FUNCTION_PATH}`;
};

const main = async (): Promise<void> => {
  const mode = getMode();
  const botToken = getRequiredEnv("TELEGRAM_BOT_TOKEN");
  const webhookSecret = getRequiredEnv("TELEGRAM_WEBHOOK_SECRET");

  const telegramApiUrl = `${TELEGRAM_API_BASE}${botToken}/setWebhook`;
  const webhookUrl = getWebhookUrl(mode);

  console.log(`set-webhook mode=${mode}`);
  console.log(`url=${webhookUrl}`);

  const result = await new deno.Command("curl", {
    args: [
      "-sG",
      telegramApiUrl,
      "--data-urlencode",
      `url=${webhookUrl}`,
      "--data-urlencode",
      `secret_token=${webhookSecret}`,
    ],
    stdout: "piped",
    stderr: "piped",
  }).output();

  const stdoutText = new TextDecoder().decode(result.stdout).trim();
  const stderrText = new TextDecoder().decode(result.stderr).trim();

  if (stdoutText) {
    console.log(stdoutText);
  }

  if (!result.success) {
    if (stderrText) {
      console.error(stderrText);
    }
    deno.exit(result.code || EXIT_FAILURE);
  }
};

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  deno.exit(EXIT_FAILURE);
}
