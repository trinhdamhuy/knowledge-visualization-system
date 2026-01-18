"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import StickyHeader from "./_components/sticky-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "@/components/animate-ui/icons/sparkles";
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
    </main>
  );
}
