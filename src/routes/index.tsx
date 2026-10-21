import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenCheck, ClipboardList, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import buddy from "@/assets/buddy.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Azure Study Buddy — your patient Microsoft Azure tutor" },
      {
        name: "description",
        content: "Learn Microsoft Azure step by step and prepare for AZ-900, AZ-104 and more with a friendly AI tutor.",
      },
      { property: "og:title", content: "Azure Study Buddy" },
      {
        property: "og:description",
        content: "A friendly AI tutor for Microsoft Azure: simple lessons, practice questions and study plans.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: BookOpenCheck, title: "Simple lessons", text: "Plain English, everyday examples, one step at a time." },
  { icon: ClipboardList, title: "Exam practice", text: "Practice questions, mock tests and study schedules." },
  { icon: Wallet, title: "Cost aware", text: "Warns you before anything that could cost money." },
  { icon: ShieldCheck, title: "Safe habits", text: "Never asks for passwords or keys. Teaches least privilege." },
];

function Landing() {
  return (
    <main className="min-h-screen bg-sky">
      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pt-16 pb-12 text-center md:pt-24">
        <img src={buddy} alt="Azure Study Buddy mascot" width={816} height={816} className="h-56 w-56 animate-float md:h-72 md:w-72" />
        <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
          Learn Azure with a <span className="text-gradient-primary">patient study buddy</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          Ask anything about Microsoft Azure and get an instant, friendly answer — plus a learning plan built around you.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg" className="bg-gradient-primary shadow-soft">
            <Link to="/study">Start learning</Link>
          </Button>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border bg-card p-5 text-left shadow-soft">
            <f.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
