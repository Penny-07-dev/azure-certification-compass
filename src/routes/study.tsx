import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { LogOut, RotateCcw, LogIn } from "lucide-react";
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

export const Route = createFileRoute("/study")({
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
  component: StudyPage,
});

const WELCOME: UIMessage = { id: "welcome", role: "assistant", parts: [{ type: "text", text: WELCOME_TEXT }] };

const STARTER_GROUPS: { label: string; prompts: string[] }[] = [
  {
    label: "Learn",
    prompts: [
      "I'm a complete beginner — what is cloud computing?",
      "Explain Azure virtual machines with an everyday example",
    ],
  },
  {
    label: "Practice",
    prompts: [
      "Quiz me with 5 AZ-900 questions and explain each answer",
      "Give me a hands-on exercise for Azure storage (free tier only)",
    ],
  },
  {
    label: "Plan",
    prompts: [
      "Build me a 4-week AZ-900 study plan, 30 minutes a day",
      "Which certification should I start with, and why?",
    ],
  },
  {
    label: "Revise",
    prompts: [
      "Give me revision notes on Azure networking basics",
      "Test me on everything we've covered so far",
    ],
  },
];

const GUEST_STORAGE_KEY = "azure-study-buddy-guest-chat";

function StudyPage() {
  const [initial, setInitial] = useState<{ messages: UIMessage[]; userId?: string }>();
  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: rows, error } = await supabase.from("chat_messages").select("message").eq("user_id", data.user.id).order("created_at", { ascending: true });
        if (error) toast.error("Couldn't load your saved conversation.");
        if (active) setInitial({ messages: (rows ?? []).map((r) => r.message as unknown as UIMessage), userId: data.user.id });
      } else {
        let messages: UIMessage[] = [];
        try {
          const stored = JSON.parse(sessionStorage.getItem(GUEST_STORAGE_KEY) ?? "[]");
          if (Array.isArray(stored)) messages = stored.filter((m) => m && typeof m.id === "string" && Array.isArray(m.parts) && (m.role === "user" || m.role === "assistant"));
        } catch { /* A fresh chat remains available if browser storage is unavailable. */ }
        if (active) setInitial({ messages });
      }
    }
    void load();
    return () => { active = false; };
  }, []);
  if (!initial) return <main className="flex h-dvh items-center justify-center bg-sky text-muted-foreground">Opening your study buddy…</main>;
  return <StudyChat saved={initial.messages} userId={initial.userId} />;
}

function StudyChat({ saved, userId }: { saved: UIMessage[]; userId?: string }) {
  const navigate = useNavigate();
  const { queryClient } = Route.useRouteContext();
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
          ...(headers ? { headers } : {}),
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

  useEffect(() => {
    if (userId) return;
    try {
      sessionStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(messages.filter((m) => m.id !== "welcome")));
    } catch { /* Chat can still continue without browser storage. */ }
  }, [messages, userId]);

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
    if (userId) {
      const { error } = await supabase.from("chat_messages").delete().eq("user_id", userId);
      if (error) {
        toast.error("Couldn't clear the chat.");
        return;
      }
    } else {
      try { sessionStorage.removeItem(GUEST_STORAGE_KEY); } catch { /* Storage may be disabled. */ }
    }
    setMessages([WELCOME]);
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const last = messages[messages.length - 1];
  const waiting = status === "submitted" || (status === "streaming" && last?.role === "user");

  return (
    <div className="flex h-dvh flex-col bg-sky">
      <header className="flex items-center justify-between border-b bg-card/70 px-4 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <img src={buddy} alt="" width={816} height={816} className="h-9 w-9 object-cover object-top" />
          <span className="font-display text-base font-semibold sm:text-lg">Azure Study Buddy</span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={startOver} disabled={busy}>
            <RotateCcw /> Start over
          </Button>
          {userId ? (
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut /><span className="hidden sm:inline">Sign out</span></Button>
          ) : (
            <Button asChild variant="ghost" size="sm"><Link to="/auth"><LogIn /><span className="hidden sm:inline">Sign in</span></Link></Button>
          )}
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
            <div className="space-y-3">
              {STARTER_GROUPS.map((g) => (
                <div key={g.label}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {g.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {g.prompts.map((s) => (
                      <Button
                        key={s}
                        variant="outline"
                        size="sm"
                        className="h-auto max-w-full whitespace-normal rounded-full bg-card text-left"
                        onClick={() => send(s)}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
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
