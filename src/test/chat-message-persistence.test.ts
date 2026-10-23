import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  options: undefined as undefined | { generateMessageId?: () => string },
  upsert: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { getClaims: async () => ({ data: { claims: { sub: "learner" } } }) },
    from: () => ({ upsert: mocks.upsert }),
  }),
}));
vi.mock("@ai-sdk/openai", () => ({ createOpenAI: () => ({ responses: () => "model" }) }));
vi.mock("ai", () => ({
  convertToModelMessages: async (messages: unknown) => messages,
  streamText: () => ({
    toUIMessageStreamResponse: (options: typeof mocks.options) => {
      mocks.options = options;
      return new Response("stream");
    },
  }),
}));
vi.mock("@/lib/ai/run-id", () => ({
  createLovableAiGatewayRunIdFetch: () => ({ fetch }),
  getLovableAiGatewayRunId: () => undefined,
  withLovableAiGatewayRunIdHeader: (response: Response) => response,
}));

import { handleChat } from "@/lib/ai/chat.server";

describe("Saved assistant replies", () => {
  it("assigns distinct nonempty IDs so separate replies cannot overwrite each other", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.invalid");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "test-public-key");
    vi.stubEnv("LOVABLE_API_KEY", "test-key");
    try {
      await handleChat(new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { authorization: "Bearer test.test.test", "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ id: "question", role: "user", parts: [{ type: "text", text: "Azure?" }] }] }),
      }));
      const generate = mocks.options?.generateMessageId;
      expect(generate).toBeTypeOf("function");
      if (!generate) throw new Error("Missing persisted reply ID generator");
      const first = generate();
      const second = generate();
      expect(first.length).toBeGreaterThan(0);
      expect(second.length).toBeGreaterThan(0);
      expect(first).not.toBe(second);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});