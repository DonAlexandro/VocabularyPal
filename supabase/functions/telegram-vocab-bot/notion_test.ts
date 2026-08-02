import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { NotionService } from "./notion.ts";

type FakePage = {
  properties: { Word: { title: [{ plain_text: string }] } };
};

const makePage = (word: string): FakePage => ({
  properties: { Word: { title: [{ plain_text: word }] } },
});

type MockQueryResult = {
  results: FakePage[];
  has_more: boolean;
  next_cursor: string | null;
};

function mockFetch(responses: MockQueryResult[]): () => void {
  let call = 0;
  const original = globalThis.fetch;
  globalThis.fetch = ((_url: unknown, _opts: unknown) =>
    Promise.resolve(
      new Response(JSON.stringify(responses[call++]), { status: 200 }),
    )) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

Deno.test(
  "existsByWord paginates until target found on second page",
  async () => {
    const restore = mockFetch([
      { results: [makePage("other")], has_more: true, next_cursor: "c1" },
      { results: [makePage("target")], has_more: false, next_cursor: null },
    ]);
    try {
      const svc = new NotionService("key", "dbid");
      assertEquals(await svc.existsByWord("target"), true);
    } finally {
      restore();
    }
  },
);

Deno.test(
  "existsByWord returns false when word absent across all pages",
  async () => {
    const restore = mockFetch([
      { results: [makePage("banana")], has_more: false, next_cursor: null },
    ]);
    try {
      const svc = new NotionService("key", "dbid");
      assertEquals(await svc.existsByWord("apple"), false);
    } finally {
      restore();
    }
  },
);

Deno.test("existsByWord matches case-insensitively", async () => {
  const restore = mockFetch([
    { results: [makePage("Apple")], has_more: false, next_cursor: null },
    { results: [makePage("Apple")], has_more: false, next_cursor: null },
  ]);
  try {
    const svc = new NotionService("key", "dbid");
    assertEquals(await svc.existsByWord("apple"), true);
    assertEquals(await svc.existsByWord("APPLE"), true);
  } finally {
    restore();
  }
});
