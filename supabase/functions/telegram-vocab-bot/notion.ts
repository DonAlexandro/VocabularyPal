import { Client } from "npm:@notionhq/client@5.23.3";
import { normalizeWord } from "./parseMessage.ts";

// Notion API 2025-09-03 (v5 default) dropped databases/{id}/query; use the stable version that still has it.
const NOTION_QUERY_VERSION = "2022-06-28";
const NOTION_API_BASE = "https://api.notion.com/v1";

type NotionClientDeps = {
  notion?: Client;
};

type CreateInput = {
  word: string;
  definition: string;
  example: string;
};

// deno-lint-ignore no-explicit-any
const extractWordFromPage = (page: any): string => {
  const title = page?.properties?.Word?.title;
  if (!Array.isArray(title) || title.length === 0) return "";
  return title[0]?.plain_text ?? "";
};

export interface INotionService {
  existsByWord(word: string): Promise<boolean>;
  createWordRow(input: CreateInput): Promise<void>;
}

export class NotionService implements INotionService {
  private readonly notion: Client;
  private readonly apiKey: string;
  private readonly databaseId: string;

  constructor(apiKey: string, databaseId: string, deps: NotionClientDeps = {}) {
    this.apiKey = apiKey;
    this.notion = deps.notion ?? new Client({ auth: apiKey });
    this.databaseId = databaseId;
  }

  async existsByWord(inputWord: string): Promise<boolean> {
    const normalized = normalizeWord(inputWord);
    let cursor: string | undefined;
    do {
      const body: Record<string, unknown> = {
        filter: { property: "Word", title: { contains: inputWord.trim() } },
        page_size: 100,
      };
      if (cursor) body.start_cursor = cursor;

      const res = await fetch(
        `${NOTION_API_BASE}/databases/${this.databaseId}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "Notion-Version": NOTION_QUERY_VERSION,
          },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) throw new Error(await res.text());
      // deno-lint-ignore no-explicit-any
      const data = (await res.json()) as any;
      // deno-lint-ignore no-explicit-any
      const found = (data.results as any[]).some(
        (page) => normalizeWord(extractWordFromPage(page)) === normalized,
      );
      if (found) return true;
      cursor = data.has_more && data.next_cursor ? data.next_cursor : undefined;
    } while (cursor);
    return false;
  }

  async createWordRow(input: CreateInput): Promise<void> {
    await this.notion.pages.create({
      parent: { database_id: this.databaseId },
      properties: {
        Word: { title: [{ text: { content: input.word } }] },
        Definition: { rich_text: [{ text: { content: input.definition } }] },
        Example: { rich_text: [{ text: { content: input.example } }] },
      },
    });
  }
}
