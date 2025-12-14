"use client";
import { useState } from "react";
import PreLoader from "./_components/pre-loader";
import StickyHeader from "./_components/sticky-header";
import Link from "next/link";
import {
  FaBrain,
  FaNetworkWired,
  FaBolt,
  FaDatabase,
  FaEye,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  const features = [
    {
      icon: <FaBrain className="w-12 h-12" />,
      title: "AI-Powered Insights",
      description:
        "Automatically extract key concepts and relationships from your content using advanced AI",
    },
    {
      icon: <FaNetworkWired className="w-12 h-12" />,
      title: "Interactive Networks",
      description:
        "Explore knowledge through dynamic, zoomable network diagrams with intuitive navigation",
    },
    {
      icon: <FaBolt className="w-12 h-12" />,
      title: "Real-time Collaboration",
      description:
        "Work together with your team in real-time, sharing insights and building knowledge",
    },
    {
      icon: <FaDatabase className="w-12 h-12" />,
      title: "Smart Organization",
      description:
        "Intelligent tagging and categorization keeps your knowledge structured and searchable",
    },
    {
      icon: <FaEye className="w-12 h-12" />,
      title: "Multiple Views",
      description:
        "Switch between graph, timeline, and hierarchical views to suit your thinking style",
    },
    {
      icon: <HiSparkles className="w-12 h-12" />,
      title: "Beautiful Visualizations",
      description:
        "Stunning, customizable visual themes that make complex data easy to understand",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Import Your Knowledge",
      description:
        "Upload documents, notes, or paste text. Support for PDFs, Word docs, markdown, and more.",
      gradient: "from-sky-400 to-blue-500",
    },
    {
      step: "02",
      title: "AI Analysis",
      description:
        "Our AI extracts key concepts, identifies relationships, and builds your knowledge graph automatically.",
      gradient: "from-violet-400 to-purple-500",
    },
    {
      step: "03",
      title: "Explore & Discover",
      description:
        "Navigate your visual knowledge network, discover insights, and make connections you never saw before.",
      gradient: "from-amber-400 to-orange-500",
    },
  ];

  return (
    <>
      {isLoading && <PreLoader onComplete={() => setIsLoading(false)} />}

      <main
        className={`transition-opacity duration-500 w-full ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Hero Section */}
        <section className="relative min-h-screen bg-gradient-to-br from-white via-sky-50 to-cyan-50 w-full overflow-hidden">
          <StickyHeader />

          {/* Animated background grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e910_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e910_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

          <div className="relative min-h-screen flex items-center justify-center px-4 md:px-8 pt-32 md:pt-40 pb-20">
            <div className="max-w-6xl mx-auto text-center space-y-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-100 border border-sky-200 rounded-full text-sky-700 text-sm backdrop-blur-sm">
                <HiSparkles className="w-4 h-4" />
                <span>Next-Gen Knowledge Management</span>
              </div>

              <p className="text-2xl md:text-4xl font-light text-slate-700 max-w-4xl mx-auto leading-relaxed">
                Visualize. Connect. Understand.
              </p>

              <p className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto">
                Transform complex information into interactive visual networks.
                Discover hidden connections and insights through intelligent
                knowledge mapping.
              </p>

              <div className="flex flex-wrap gap-4 justify-center pt-8">
                <Link href="/login">
                  <button className="px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-xl hover:scale-105 transition-transform shadow-lg shadow-sky-500/30">
                    Start Visualizing
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="min-h-screen bg-slate-50 py-20 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                Powerful Features
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Everything you need to visualize and manage knowledge
                effectively
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-sky-200 hover:-translate-y-2"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 py-20 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                How It Works
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Three simple steps to transform your knowledge
              </p>
            </div>

            <div className="space-y-24">
              {steps.map((item, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  } items-center gap-12`}
                >
                  <div className="flex-1">
                    <div
                      className={`inline-block px-6 py-2 bg-linear-to-r ${item.gradient} text-white font-black text-4xl rounded-2xl mb-6`}
                    >
                      {item.step}
                    </div>
                    <h3 className="text-4xl font-bold text-slate-900 mb-6">
                      {item.title}
                    </h3>
                    <p className="text-xl text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex-1">
                    <div
                      className={`w-full aspect-square bg-linear-to-br ${item.gradient} rounded-3xl shadow-2xl opacity-20`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="min-h-screen bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 py-20 px-4 md:px-8 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-size-[4rem_4rem]" />

          <div className="relative max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
              Ready to Visualize Your Knowledge?
            </h2>
            <p className="text-xl md:text-2xl text-sky-100">
              Join thousands of researchers, students, and professionals who use
              <span className="font-bold text-white"> KNOVION</span>
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-8">
              <Link href="/login">
                <button className="px-8 py-4 bg-white text-slate-900 font-semibold rounded-xl hover:scale-105 transition-transform shadow-lg shadow-white/30">
                  Get Started Now
                </button>
              </Link>
            </div>

            <div className="pt-12 flex items-center justify-center gap-8 text-sky-100">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">10K+</div>
                <div className="text-sm">Active Users</div>
              </div>
              <div className="w-px h-12 bg-white/30" />
              <div className="text-center">
                <div className="text-3xl font-bold text-white">1M+</div>
                <div className="text-sm">Knowledge Nodes</div>
              </div>
              <div className="w-px h-12 bg-white/30" />
              <div className="text-center">
                <div className="text-3xl font-bold text-white">99.9%</div>
                <div className="text-sm">Uptime</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
