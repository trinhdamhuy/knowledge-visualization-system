"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HiMenu, HiX } from "react-icons/hi";

export default function StickyHeader() {
  const headerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      {/* Header - chỉ hiện khi scroll */}
      <nav
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ${
          isScrolled
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0"
        }`}
        style={{
          backgroundColor: "rgba(14, 165, 233, 0.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 py-3">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div
              ref={logoRef}
              className="font-bold text-white text-xl md:text-2xl tracking-wide"
              style={{
                fontFamily: "Arial Black, sans-serif",
              }}
            >
              KNOVION
            </div>
          </Link>

          {/* Desktop Buttons */}
          <div className="hidden md:flex gap-3 items-center">
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
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all duration-200"
            aria-label="Open menu"
          >
            <HiMenu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Button - hiện khi chưa scroll (chỉ trên mobile) */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className={`md:hidden fixed top-4 right-4 z-50 p-3 rounded-xl bg-white/90 text-slate-700 shadow-lg transition-all duration-300 ${
          isScrolled ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        aria-label="Open menu"
      >
        <HiMenu className="w-6 h-6" />
      </button>

      {/* Mobile Sidebar Menu */}
      <div
        className={`md:hidden fixed inset-y-0 right-0 z-[60] w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-4 right-4 p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          aria-label="Close menu"
        >
          <HiX className="w-6 h-6 text-slate-700" />
        </button>

        {/* Menu Header */}
        <div className="p-6 pt-16 border-b border-slate-100">
          <div
            className="font-bold text-2xl"
            style={{
              background:
                "linear-gradient(135deg, #142850 0%, #0C7B93 50%, #00A8CC 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            KNOVION
          </div>
          <p className="text-slate-500 text-sm mt-2">Knowledge Visualization</p>
        </div>

        {/* Menu Buttons */}
        <div className="flex flex-col gap-3 p-6">
          <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
            <button className="w-full px-6 py-3 bg-slate-100 text-slate-700 font-semibold text-base rounded-lg hover:bg-slate-200 transition-all duration-200">
              Login
            </button>
          </Link>

          <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
            <button className="w-full px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-base rounded-lg hover:from-sky-600 hover:to-blue-700 transition-all duration-200 shadow-lg">
              Sign Up
            </button>
          </Link>
        </div>
      </div>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-[59] backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
