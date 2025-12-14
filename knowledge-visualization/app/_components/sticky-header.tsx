"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HiMenu, HiX } from "react-icons/hi";

export default function StickyHeader() {
  const headerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const leftLinksRef = useRef<HTMLElement>(null);
  const rightLinksRef = useRef<HTMLElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    gsap.set(logoRef.current, {
      fontSize: "clamp(3rem, 12vw, 10rem)",
      letterSpacing: "0.15em",
      color: "#0C7B93",
      paddingTop: "clamp(1rem, 4vh, 2rem)",
      paddingBottom: "clamp(1rem, 4vh, 2rem)",
    });

    gsap.set(headerRef.current, {
      backgroundColor: "transparent",
    });

    gsap.set([leftLinksRef.current, rightLinksRef.current], {
      opacity: 0,
      x: 0,
    });

    window.scrollTo(0, 0);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "+=500",
        scrub: 1,
        onUpdate: (self) => {
          setShowButtons(self.progress > 0.3);
        },
      },
    });

    tl.to(logoRef.current, {
      fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
      letterSpacing: "0.05em",
      paddingTop: "0.5rem",
      paddingBottom: "0.5rem",
      background: "none",
      webkitTextFillColor: "#ffffff",
      color: "#ffffff",
      ease: "power2.out",
    })
      .to(
        headerRef.current,
        {
          backgroundColor: "rgba(14, 165, 233, 0.95)",
          backdropFilter: "blur(10px)",
          ease: "power2.out",
        },
        "<"
      )
      .to(
        [leftLinksRef.current, rightLinksRef.current],
        {
          opacity: 1,
          ease: "power2.out",
        },
        "<"
      );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <>
      <nav
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 w-full text-white"
        style={{ backgroundColor: "transparent" }}
      >
        <div className="w-full flex items-center justify-between px-4 md:px-8 py-2">
          {/* Left spacer for desktop */}
          <section ref={leftLinksRef} className="hidden md:block flex-1" />

          {/* Logo */}
          <section className="flex justify-center md:flex-1">
            <Link href="/">
              <div
                ref={logoRef}
                className="text-center font-bold cursor-pointer"
                style={{
                  fontSize: "clamp(3rem, 12vw, 10rem)",
                  letterSpacing: "0.15em",
                  fontFamily: "Arial Black, sans-serif",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  paddingTop: "clamp(1rem, 4vh, 2rem)",
                  paddingBottom: "clamp(1rem, 4vh, 2rem)",
                  background: 'linear-gradient(135deg, #142850 0%, #0C7B93 50%, #00A8CC 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                KNOVION
              </div>
            </Link>
          </section>

          {/* Desktop Buttons */}
          <section
            ref={rightLinksRef}
            className={`hidden md:flex gap-3 justify-end items-center flex-1 transition-opacity duration-300 ${
              showButtons ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <Link href="/login">
              <button className="px-5 py-2 bg-white/20 backdrop-blur-sm text-white font-semibold text-sm rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-200">
                Login
              </button>
            </Link>

            <Link href="/sign-up">
              <button className="px-5 py-2 bg-white text-sky-600 font-semibold text-sm rounded-lg hover:bg-sky-50 transition-all duration-200 shadow-md">
                Sign Up
              </button>
            </Link>
          </section>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden absolute right-4 top-1/2 -translate-y-1/2">
            {showButtons && (
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 bg-white text-slate-900 rounded-md border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all duration-100"
                aria-label="Open menu"
              >
                <HiMenu className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Menu */}
      <div
        className={`md:hidden fixed inset-y-0 right-0 z-[60] w-80 bg-gradient-to-b from-teal-50 to-cyan-50 shadow-2xl transform transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-4 right-4 p-3 bg-white border-3 border-slate-900 rounded-lg shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all duration-100"
          aria-label="Close menu"
        >
          <HiX className="w-6 h-6 text-slate-900" />
        </button>

        {/* Menu Items */}
        <nav className="flex flex-col gap-4 p-8 pt-20">
          <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
            <button className="w-full px-6 py-4 bg-white/20 backdrop-blur-sm text-slate-700 font-semibold text-base rounded-lg border border-slate-200 hover:bg-white/40 transition-all duration-200">
              Login
            </button>
          </Link>

          <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
            <button className="w-full px-6 py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-base rounded-lg hover:from-sky-600 hover:to-blue-700 transition-all duration-200 shadow-lg">
              Sign Up
            </button>
          </Link>
        </nav>
      </div>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-[59]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
