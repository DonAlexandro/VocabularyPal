export type Phase =
  | "input_parsing"
  | "notion_lookup"
  | "gpt_request"
  | "gpt_unavailable"
  | "gpt_validation"
  | "notion_insert";

export type ItemResult =
  | {
    status: "created";
    input: string;
    savedWord: string;
    notionUrl: string;
  }
  | { status: "skipped"; input: string; reason: string }
  | { status: "failed"; input: string; phase: Phase; reason: string };

export type Summary = {
  created: number;
  skipped: number;
  failed: number;
  failures: Array<{ input: string; phase: Phase; reason: string }>;
};

export type TelegramMessageContext = {
  chatId: number;
  messageText: string;
};

export type GptVocabulary = {
  word: string;
  definition: string;
  example: string;
};
