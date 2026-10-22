import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { LogOut, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { WELCOME_TEXT } from "@/lib/ai/tutor-prompt";
import buddy from "@/assets/buddy.png";

export const Route = createFileRoute("/_authenticated/study")({
  head: () => ({
    meta: [
      { title: "Study session — Azure Study Buddy" },
      { name: "description", content: "Chat with your Azure Study Buddy and learn Microsoft Azure step by step." },
      { property: "og:title", content: "Study session — Azure Study Buddy" },
      { property: "og:description", content: "Your personal Microsoft Azure tutoring session." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("message")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return { messages: (data ?? []).map((r) => r.message as unknown as UIMessage) };
  },
  component: StudyPage,
});

const WELCOME: UIMessage = { id: "welcome", role: "assistant", parts: [{ type: "text", text: WELCOME_TEXT }] };

const STARTERS = [
  "I'm a complete beginner — what is cloud computing?",
  "Help me make a 4-week plan for AZ-900",
  "Give me 5 practice questions on Azure storage",
];

function StudyPage() {
  const { messages: saved } = Route.useLoaderData();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
        prepareSendMessagesRequest: ({ messages, headers, body }) => ({
          headers,
          body: { ...body, messages: messages.filter((m) => m.id !== "welcome") },
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: "study",
    messages: [WELCOME, ...saved],
    transport,
    onError: (err) => toast.error(err.message || "Couldn't reach your study buddy. Please try again."),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy]);

  function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
  }

  async function startOver() {
    if (!confirm("Start a fresh conversation? Your current chat will be cleared.")) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return toast.error("Please sign in again.");
    const { error } = await supabase.from("chat_messages").delete().eq("user_id", data.user.id);
    if (error) return toast.error("Couldn't clear the chat.");
    setMessages([WELCOME]);
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const last = messages[messages.length - 1];
  const waiting = status === "submitted" || (status === "streaming" && last?.role === "user");

  return (
    <div className="flex h-dvh flex-col bg-sky">
      <header className="flex items-center justify-between border-b bg-card/70 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <img src={buddy} alt="" width={816} height={816} className="h-9 w-9 object-cover object-top" />
          <span className="font-display text-lg font-semibold">Azure Study Buddy</span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={startOver} disabled={busy}>
            <RotateCcw /> Start over
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut /> Sign out
          </Button>
        </div>
      </header>

      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {messages.map((m) => (
            <Message from={m.role} key={m.id}>
              <MessageContent className="text-[15px] leading-relaxed group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground">
                {m.parts.map((p, i) => {
                  if (p.type === "text")
                    return m.role === "user" ? (
                      <p key={i} className="whitespace-pre-wrap">{p.text}</p>
                    ) : (
                      <MessageResponse key={i}>{p.text}</MessageResponse>
                    );
                  if (p.type === "reasoning" && p.text)
                    return (
                      <Reasoning key={i} isStreaming={status === "streaming" && m.id === last?.id} defaultOpen={false}>
                        <ReasoningTrigger />
                        <ReasoningContent>{p.text}</ReasoningContent>
                      </Reasoning>
                    );
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}
          {waiting && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking...</Shimmer>
              </MessageContent>
            </Message>
          )}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <Button key={s} variant="outline" size="sm" className="rounded-full bg-card" onClick={() => send(s)}>
                  {s}
                </Button>
              ))}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        <PromptInput onSubmit={({ text }) => send(text)} className="bg-card shadow-soft">
          <PromptInputTextarea ref={textareaRef} placeholder="Ask your Azure question…" autoFocus />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Always check prices and exam details on Microsoft Learn. Never share passwords or keys.
        </p>
      </div>
    </div>
  );
}
