"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import StickyHeader from "./_components/sticky-header";
import { TestimonialsColumn } from "@/components/testimonials-columns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "@/components/animate-ui/icons/sparkles";
import { RetroGrid } from "@/components/ui/retro-grid";
import { motion } from "motion/react";

const FEATURES = [
  {
    title: "AI-Powered Insights",
    description:
      "Automatically extract key concepts, relationships, and structures from documents, PDFs, and notes.",
    badge: "AI-first",
  },
  {
    title: "Interactive Knowledge Graphs",
    description:
      "Explore interactive knowledge networks with smooth zoom and pan, and multiple perspectives.",
    badge: "Graph view",
  },
  {
    title: "Real-time Collaboration",
    description:
      "Co-create knowledge maps with your team in real time with clear access control.",
    badge: "Live",
  },
  {
    title: "Smart Organization",
    description:
      "Smart tagging, structure, and instant search so you never lose track of important information.",
    badge: "Structured",
  },
  {
    title: "Multi-view Visualization",
    description:
      "Switch between graph, timeline, and hierarchical views to match how you think.",
    badge: "Multi-view",
  },
  {
    title: "Beautiful by Default",
    description:
      "System-aware dark/light themes and refined typography keep your knowledge readable and beautiful.",
    badge: "Design",
  },
] as const;

const TESTIMONIALS = [
  {
    text: "Knovion turned my messy collection of documents into a clear, visual knowledge map, perfect for long-term research.",
    name: "Minh Anh Nguyen",
    role: "PhD Researcher",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
  },
  {
    text: 'I no longer just store information; I can actually "see" how everything connects.',
    name: "Duc Huy Tran",
    role: "Data Scientist",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
  },
  {
    text: "My students understand abstract concepts much faster when I explain them with Knovion.",
    name: "Huong Le",
    role: "University Lecturer",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
  },
  {
    text: "I learn from many online sources; Knovion is where I gather, connect, and review everything.",
    name: "Nam Pham",
    role: "CS Student",
    image: "https://randomuser.me/api/portraits/men/4.jpg",
  },
  {
    text: "Real-time collaboration is incredibly helpful for our R&D team. Everyone sees the bigger picture as it evolves.",
    name: "Mai Hoang",
    role: "R&D Lead",
    image: "https://randomuser.me/api/portraits/women/5.jpg",
  },
  {
    text: "The interface is beautiful and thoughtful — exactly the kind of tool I want to open every day to think and create.",
    name: "Thanh Ha Vu",
    role: "UX Designer",
    image: "https://randomuser.me/api/portraits/women/6.jpg",
  },
] as const;

function FadeInSection({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.7, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const firstColumn = TESTIMONIALS.slice(0, 2);
  const secondColumn = TESTIMONIALS.slice(2, 4);
  const thirdColumn = TESTIMONIALS.slice(4, 6);

  return (
    <main className="relative min-h-screen w-full bg-linear-to-b from-background via-background/95 to-background text-foreground">
      <StickyHeader />
      {/* Hero */}
      <section className="relative mx-auto flex min-h-[80vh] max-w-6xl flex-col items-center overflow-hidden px-4 pb-24 pt-24 md:px-8 lg:pt-32">
        <FadeInSection className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 p-1 text-xs font-medium text-muted-foreground backdrop-blur-md">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-linear-to-br from-sky-500 to-indigo-500 text-[10px] text-white shadow-sm shadow-sky-500/40">
            <Sparkles size={14} />
          </span>
          <span className="hidden sm:inline">Next-gen knowledge canvas</span>
          <span className="inline sm:hidden">Visual knowledge, reimagined</span>
          <span className="ml-2 rounded-full bg-linear-to-r from-emerald-500/15 to-sky-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 dark:text-emerald-300">
            AI-native
          </span>
        </FadeInSection>

        <FadeInSection className="mt-10 flex flex-col items-center gap-8 text-center">
          <h1 className="bg-linear-to-br from-sky-500 via-cyan-400 to-indigo-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
            Visualize your
            <span className="block bg-linear-to-r from-foreground to-foreground/80 bg-clip-text pb-8">
              knowledge as a living graph.
            </span>
          </h1>

          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl">
            Knovion is your space for visual knowledge — where notes, documents,
            and ideas connect into a living map that is easy to see, remember,
            and share.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link href="/login">
              <Button
                size="lg"
                className="rounded-full bg-linear-to-r from-sky-500 via-cyan-500 to-indigo-500 px-7 text-base font-semibold text-white shadow-lg shadow-sky-500/30 transition-transform hover:-translate-y-0.5 hover:shadow-sky-500/40"
              >
                Start visualizing
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-border/70 bg-background/70 px-6 text-base font-medium backdrop-blur-md"
              >
                Create a new workspace
              </Button>
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground sm:text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 ring-1 ring-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Real-time collaboration
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 ring-1 ring-sky-500/30">
              <span className="h-1 w-3 rounded-full bg-linear-to-r from-sky-400 to-indigo-400" />
              AI-assisted mapping
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 ring-1 ring-violet-500/30">
              Dark & Light theme
            </span>
          </div>
        </FadeInSection>
      </section>
      {/* Feature grid */}
      <section className="relative mx-auto w-full max-w-6xl px-4 pb-20 md:px-8 lg:pb-28">
        <FadeInSection className="mb-10 flex flex-col items-start justify-between gap-4 sm:mb-12 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-500 dark:text-sky-300">
              Features
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
              Designed for people who think in maps and graphs.
            </h2>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Every feature is built around one goal: helping you understand
            better, not just store more.
          </p>
        </FadeInSection>

        <FadeInSection
          className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          delay={0.05}
        >
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border-border/70 bg-background/80 shadow-sm transition-all hover:-translate-y-1 hover:border-sky-500/60 hover:shadow-lg hover:shadow-sky-500/20"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute inset-0 bg-linear-to-r from-sky-500/5 via-cyan-500/8 to-indigo-500/10 dark:from-sky-500/10 dark:via-cyan-500/12 dark:to-indigo-500/14" />
              </div>
              <CardHeader className="relative space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-600 ring-1 ring-sky-500/30 dark:text-sky-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  {feature.badge}
                </div>
                <CardTitle className="text-base font-semibold sm:text-lg">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative pb-6 text-sm text-muted-foreground sm:text-[15px]">
                {feature.description}
              </CardContent>
            </Card>
          ))}
        </FadeInSection>
      </section>
      {/* Testimonials */}
      <section className="relative mx-auto w-full max-w-6xl px-4 pb-20 pt-16 md:px-8 lg:pb-28">
        <FadeInSection className="mb-10 text-center sm:mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-500 dark:text-violet-300">
            Voices
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            People who let Knovion think alongside them.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Hear from researchers, students, and product teams who use Knovion
            every day.
          </p>
        </FadeInSection>

        <FadeInSection
          className="flex max-h-[540px] justify-center gap-6 overflow-hidden pt-2 md:gap-8"
          delay={0.05}
        >
          <TestimonialsColumn duration={18} testimonials={firstColumn} />
          <TestimonialsColumn
            className="hidden md:block"
            duration={22}
            testimonials={secondColumn}
          />
          <TestimonialsColumn
            className="hidden lg:block"
            duration={20}
            testimonials={thirdColumn}
          />
        </FadeInSection>
      </section>
      {/* CTA */}
      <section className="relative mx-auto w-full max-w-5xl px-4 pb-24 md:px-8 lg:pb-32">
        <FadeInSection>
          <Card className="relative overflow-hidden border-border/70 bg-background/95 shadow-xl shadow-sky-500/10">
            <RetroGrid
              cellSize={80}
              opacity={0.35}
              lightLineColor="rgba(56,189,248,0.45)"
              darkLineColor="rgba(129,140,248,0.45)"
            />

            <div className="relative flex flex-col items-center gap-6 px-6 py-10 text-center sm:px-10 sm:py-12 md:py-14">
              <p className="inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-[11px] font-medium text-muted-foreground ring-1 ring-border/80 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Ready for your next deep thinking session
              </p>
              <h2 className="bg-linear-to-r from-foreground via-foreground/90 to-foreground/75 bg-clip-text text-2xl font-semibold tracking-tight text-transparent sm:text-3xl md:text-4xl">
                Start your first knowledge map with Knovion.
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Log in to continue where you left off, or create a new account
                and build your first knowledge graph in minutes.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="rounded-full bg-linear-to-r from-sky-500 via-cyan-500 to-indigo-500 px-7 text-base font-semibold text-white shadow-lg shadow-sky-500/30 hover:-translate-y-0.5 hover:shadow-sky-500/40"
                  >
                    Log in
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full border-border/70 bg-background/80 px-6 text-base font-medium backdrop-blur"
                  >
                    Create a free account
                  </Button>
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Unlimited personal knowledge nodes</span>
                </div>
                <div className="h-3 w-px bg-border/70" />
                <div className="flex items-center gap-2">
                  <span className="h-1 w-3 rounded-full bg-linear-to-r from-sky-400 to-indigo-400" />
                  <span>Theme synced with your operating system</span>
                </div>
              </div>
            </div>
          </Card>
        </FadeInSection>
      </section>
    </main>
  );
}
