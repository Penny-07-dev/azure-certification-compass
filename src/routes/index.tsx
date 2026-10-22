import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpenCheck,
  ClipboardList,
  GraduationCap,
  MessageCircleQuestion,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import buddy from "@/assets/buddy.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Azure Study Buddy — your patient Microsoft Azure tutor" },
      {
        name: "description",
        content:
          "Learn Microsoft Azure step by step and prepare for AZ-900, AZ-104 and more with a friendly AI tutor that builds a plan around you.",
      },
      { property: "og:title", content: "Azure Study Buddy" },
      {
        property: "og:description",
        content:
          "A friendly AI tutor for Microsoft Azure: simple lessons, practice questions, mock tests and personal study plans.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const CERTS = ["AZ-900", "AZ-104", "AZ-204", "AZ-305", "AZ-500", "AI-900", "DP-900"];

const steps = [
  {
    icon: MessageCircleQuestion,
    title: "1. Tell it your goal",
    text: "Share your experience and the certification or skill you're aiming for.",
  },
  {
    icon: BookOpenCheck,
    title: "2. Learn step by step",
    text: "Small lessons in plain English, with everyday examples and hands-on exercises.",
  },
  {
    icon: GraduationCap,
    title: "3. Practice and revise",
    text: "Quiz yourself, take mock tests, and revisit the topics you find hard.",
  },
];

const features = [
  {
    icon: Sparkles,
    title: "A plan built around you",
    text: "Lessons adapt to your pace, goals and target certification — and it remembers where you left off.",
  },
  {
    icon: ClipboardList,
    title: "Real exam practice",
    text: "Practice questions and mock tests that explain why the right answer is right — and the others aren't.",
  },
  {
    icon: Wallet,
    title: "Cost aware",
    text: "Warns you before any exercise that could cost money, and prefers free tiers and sandboxes.",
  },
  {
    icon: ShieldCheck,
    title: "Safe habits",
    text: "Never asks for passwords or keys, and teaches least-privilege security from day one.",
  },
];

function Landing() {
  return (
    <main className="min-h-screen bg-sky">
      {/* Hero */}
      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pt-14 pb-12 text-center md:pt-20">
        <img
          src={buddy}
          alt="Azure Study Buddy mascot"
          width={816}
          height={816}
          className="h-48 w-48 animate-float md:h-64 md:w-64"
        />
        <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
          Learn Azure with a <span className="text-gradient-primary">patient study buddy</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          Ask anything about Microsoft Azure and get a friendly, step-by-step answer — plus a
          learning plan built around your goals.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-gradient-primary shadow-soft">
            <Link to="/study">Start learning — it's free</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-card">
            <a href="#how-it-works">See how it works</a>
          </Button>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {CERTS.map((c) => (
            <span
              key={c}
              className="rounded-full border bg-card px-3 py-1 text-xs font-semibold text-secondary-foreground"
            >
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* Sample conversation */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="rounded-3xl border bg-card p-6 shadow-soft md:p-8">
          <div className="space-y-4">
            <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
              I'm a complete beginner — what is cloud computing?
            </div>
            <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm text-secondary-foreground">
              <p className="font-semibold">Great first question! ☁️</p>
              <p className="mt-1">
                Think of it like electricity: instead of owning a generator, you plug into the grid
                and pay for what you use. Cloud computing is the same idea for computing power…
              </p>
              <p className="mt-2 text-xs opacity-80">
                ✅ Learning objective stated &nbsp;•&nbsp; 🌍 Real-world example &nbsp;•&nbsp; ❓ One
                check-in question
              </p>
            </div>
          </div>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Every lesson follows a teaching method: objective → simple explanation → real example →
            exercise → a question to check you understood.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="text-center text-2xl font-bold md:text-3xl">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.title} className="rounded-2xl border bg-card p-6 text-left shadow-soft">
              <s.icon className="h-7 w-7 text-primary" />
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="text-center text-2xl font-bold md:text-3xl">Built for real learning</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-5 text-left shadow-soft">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-20 text-center">
        <div className="rounded-3xl border bg-card p-10 shadow-soft">
          <RouteIcon className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 text-2xl font-bold md:text-3xl">Your Azure journey starts with one question</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Sign in, tell your buddy where you're starting from, and get a plan you can follow today.
          </p>
          <Button asChild size="lg" className="mt-6 bg-gradient-primary shadow-soft">
            <Link to="/study">Meet your study buddy</Link>
          </Button>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          Azure Study Buddy is a learning aid — always verify prices, limits and exam objectives on
          Microsoft Learn.
        </p>
      </section>
    </main>
  );
}
