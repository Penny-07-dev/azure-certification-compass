import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import type { Database } from "@/integrations/supabase/types";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "./run-id";
import { TUTOR_INSTRUCTIONS } from "./tutor-prompt";

const MODEL = "openai/gpt-6-astra";

function userClient(token: string) {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error("Sign-in is not configured.");
  return createClient<Database>(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { "content-type": "application/json" } });

export async function handleChat(request: Request): Promise<Response> {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || token.split(".").length !== 3) return json(401, "Please sign in again.");

  const supabase = userClient(token);
  const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
  const userId = claims?.claims?.sub;
  if (claimsError || !userId) return json(401, "Please sign in again.");

  let messages: UIMessage[];
  try {
    const body = (await request.json()) as { messages?: UIMessage[] };
    if (!Array.isArray(body.messages) || body.messages.length === 0) return json(400, "No message sent.");
    messages = body.messages;
  } catch {
    return json(400, "Invalid request.");
  }

  const last = messages[messages.length - 1];
  if (last?.role === "user") {
    const { error } = await supabase
      .from("chat_messages")
      .upsert(
        { user_id: userId, message_id: last.id, message: last as never },
        { onConflict: "user_id,message_id" },
      );
    if (error) console.error("Failed to save user message", error);
  }

  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) return json(500, "AI is not configured.");

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(MODEL),
    instructions: TUTOR_INSTRUCTIONS,
    messages: await convertToModelMessages(messages),
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  const response = result.toUIMessageStreamResponse({
    originalMessages: messages,
    generateMessageId: () => crypto.randomUUID(),
    sendReasoning: true,
    onFinish: async ({ responseMessage }) => {
      if (!responseMessage?.parts?.length) return;
      const { error } = await supabase
        .from("chat_messages")
        .upsert(
          { user_id: userId, message_id: responseMessage.id, message: responseMessage as never },
          { onConflict: "user_id,message_id" },
        );
      if (error) console.error("Failed to save assistant message", error);
    },
    onError: (error) => {
      console.error("Chat stream error", error);
      const status = (error as { statusCode?: number })?.statusCode;
      if (status === 429) return "Too many requests right now — please wait a moment and try again.";
      if (status === 402) return "AI credits have run out. The app owner needs to add credits to continue.";
      return "Sorry, something went wrong while answering. Please try again.";
    },
  });

  return withLovableAiGatewayRunIdHeader(response, runIdFetch);
}
