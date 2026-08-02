# VocabularyPal

Telegram bot on Supabase Edge Functions (Deno). Reads vocabulary items from Telegram, enriches with
GPT, stores in Notion.

## Prerequisites

- Deno installed
- Supabase CLI installed (deploy only)
- Telegram bot token
- Notion integration key + database id
- Gemini API key

## Setup

Create env files:

```bash
cp .env.example .env.local
cp .env.example .env.prod
```

Fill values:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `NOTION_API_KEY`
- `NOTION_DATABASE_ID`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

## Run Locally

Install deps and approve required npm lifecycle scripts once:

```bash
deno task setup
```

Start edge function:

```bash
deno task dev
```

Run checks:

```bash
deno task check
deno task test
```

Expose local webhook when using `deno task dev` (default port `8000`):

```bash
ngrok http 8000
```

Set `LOCAL_WEBHOOK_URL` in `.env.local` to the ngrok https URL.

Register Telegram webhook for local:

```bash
deno task set-webhook:local
```

Verify webhook:

```bash
deno task webhook-info:local
```

## Deploy

Fill production values in `.env.prod`

Push secrets:

```bash
supabase secrets set --env-file .env.prod
```

Deploy function:

```bash
supabase functions deploy telegram-vocab-bot --no-verify-jwt
```

Register Telegram webhook for production:

```bash
deno task set-webhook:production
```

Verify production webhook:

```bash
deno task webhook-info:production
```
