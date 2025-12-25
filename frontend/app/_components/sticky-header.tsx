"use client";

import { useState } from "react";
import Link from "next/link";
import { HiMenu, HiX } from "react-icons/hi";
import { ThemeToggle } from "@/app/_components/buttons/theme-toggle";
import { Button } from "@/components/ui/button";

export default function StickyHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="sticky top-0 left-0 right-0 z-50 w-full">
      {/* Header */}
      <nav className="w-full border-b border-border/40 bg-background/50 backdrop-blur-lg transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <div className="bg-linear-to-r from-sky-500 via-cyan-400 to-indigo-500 bg-clip-text text-xl font-extrabold tracking-wide text-transparent md:text-2xl">
              KNOVION
            </div>
          </Link>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-4 md:flex">
            <ThemeToggle className="rounded-full" />
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button
                  variant="outline"
                  className="rounded-full border-border/60 bg-background/60 backdrop-blur-md"
                >
                  Login
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="rounded-full bg-linear-to-r from-sky-500 via-cyan-500 to-indigo-500 text-white shadow-md shadow-sky-500/30 hover:from-sky-500 hover:via-cyan-500 hover:to-indigo-500">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle className="rounded-full" />
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="inline-flex items-center justify-center rounded-xl bg-foreground/5 p-2 text-foreground hover:bg-foreground/10"
              aria-label="Open menu"
            >
              <HiMenu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Menu */}
      <div
        className={`fixed inset-y-0 right-0 z-40 w-80 max-w-[85vw] transform bg-background/95 shadow-2xl ring-1 ring-border/60 transition-transform duration-300 ease-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute right-4 top-4 rounded-full bg-foreground/5 p-2 text-foreground hover:bg-foreground/10"
          aria-label="Close menu"
        >
          <HiX className="h-6 w-6" />
        </button>

        {/* Menu Header */}
        <div className="border-b border-border/60 p-6 pt-16">
          <div className="bg-linear-to-r from-sky-500 via-cyan-400 to-indigo-500 bg-clip-text text-2xl font-extrabold text-transparent">
            KNOVION
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Knowledge Visualization
          </p>
        </div>

        {/* Menu Buttons */}
        <div className="flex flex-col gap-3 p-6">
          <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
            <Button
              variant="outline"
              className="w-full justify-center rounded-xl border-border bg-background/60"
            >
              Login
            </Button>
          </Link>

          <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
            <Button className="w-full justify-center rounded-xl bg-linear-to-r from-sky-500 via-cyan-500 to-indigo-500 text-white shadow-lg shadow-sky-500/30">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <button
          aria-label="Close menu overlay"
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
