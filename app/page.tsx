"use client";

import { useState, useEffect } from "react";
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
import { LogoCloud } from "@/components/logo-cloud";
import { TestimonialsColumn } from "@/components/testimonials-columns";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [showPreloader, setShowPreloader] = useState(false);

  useEffect(() => {
    const hasSeenPreloader = localStorage.getItem("knovion_preloader_seen");

    if (hasSeenPreloader) {
      setTimeout(() => {
        setIsLoading(false);
        setShowPreloader(false);
      }, 1000);
    } else {
      setTimeout(() => {
        setShowPreloader(true);
      }, 1000);
    }
  }, []);

  const handlePreloaderComplete = () => {
    localStorage.setItem("knovion_preloader_seen", "true");
    setIsLoading(false);
  };

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

  const testimonials = [
    {
      text: "Knovion completely changed how I organize my research. Connecting complex concepts is now intuitive and effortless.",
      image: "https://randomuser.me/api/portraits/women/1.jpg",
      name: "Nguyen Minh Anh",
      role: "PhD Researcher",
    },
    {
      text: "The AI auto-analysis feature saves me hours of work. Hidden relationships in data are displayed clearly and beautifully.",
      image: "https://randomuser.me/api/portraits/men/2.jpg",
      name: "Tran Duc Huy",
      role: "Data Scientist",
    },
    {
      text: "My students love using Knovion for revision. Interactive mind maps help them grasp knowledge much faster.",
      image: "https://randomuser.me/api/portraits/women/3.jpg",
      name: "Le Thi Huong",
      role: "University Lecturer",
    },
    {
      text: "Finally a tool that helps me manage massive knowledge from online courses in a systematic way.",
      image: "https://randomuser.me/api/portraits/men/4.jpg",
      name: "Pham Van Nam",
      role: "Computer Science Student",
    },
    {
      text: "Real-time collaboration is incredibly useful for our research team. Everyone can contribute and track progress seamlessly.",
      image: "https://randomuser.me/api/portraits/women/5.jpg",
      name: "Hoang Thi Mai",
      role: "R&D Team Lead",
    },
    {
      text: "Beautiful and user-friendly interface. I've tried many mind map tools but Knovion excels in visualization capabilities.",
      image: "https://randomuser.me/api/portraits/women/6.jpg",
      name: "Vu Thanh Ha",
      role: "UX Designer",
    },
    {
      text: "Knovion helps me prepare more professional presentations. Clients are impressed with the visual knowledge delivery.",
      image: "https://randomuser.me/api/portraits/men/7.jpg",
      name: "Do Quang Minh",
      role: "Business Consultant",
    },
    {
      text: "As a content creator, I need clear idea organization. Knovion is an essential tool in my workflow.",
      image: "https://randomuser.me/api/portraits/women/8.jpg",
      name: "Bui Ngoc Linh",
      role: "Content Creator",
    },
    {
      text: "PDF document import is super convenient. AI automatically extracts key concepts, saving me tons of time.",
      image: "https://randomuser.me/api/portraits/men/9.jpg",
      name: "Ngo Dinh Khoa",
      role: "Legal Consultant",
    },
  ];

  const firstColumn = testimonials.slice(0, 3);
  const secondColumn = testimonials.slice(3, 6);
  const thirdColumn = testimonials.slice(6, 9);

  return (
    <>
      {showPreloader && isLoading && (
        <PreLoader onComplete={handlePreloaderComplete} />
      )}

      <main
        className={`transition-opacity duration-500 w-full ${
          showPreloader && isLoading ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Hero Section */}
        <section className="relative min-h-screen bg-linear-to-br from-white via-sky-50 to-cyan-50 w-full overflow-hidden">
          <StickyHeader />

          {/* Animated background grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e910_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e910_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

          <div className="relative min-h-screen flex items-center justify-center px-4 md:px-8 pt-24 pb-20">
            <div className="max-w-6xl mx-auto text-center space-y-8">
              {/* Large KNOVION text */}
              <h1
                className="text-6xl md:text-8xl lg:text-9xl font-black"
                style={{
                  background:
                    "linear-gradient(135deg, #142850 0%, #0C7B93 50%, #00A8CC 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontFamily: "Arial Black, sans-serif",
                  letterSpacing: "0.05em",
                }}
              >
                KNOVION
              </h1>

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
                  <button className="px-8 py-4 bg-linear-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-xl hover:scale-105 transition-transform shadow-lg shadow-sky-500/30">
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
                  <div className="w-16 h-16 bg-linear-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
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

        {/* Logo Cloud Section */}
        <section className="bg-white py-20 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                Trusted by Industry Leaders
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Join thousands of professionals and organizations who trust
                Knovion
              </p>
            </div>
            <div className="mask-[linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
              <LogoCloud />
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="bg-slate-50 py-20 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                What Our Users Say
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                See how Knovion is transforming the way people visualize and
                manage knowledge
              </p>
            </div>

            <div className="flex max-h-[740px] justify-center gap-6 overflow-hidden mask-[linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]">
              <TestimonialsColumn duration={16} testimonials={firstColumn} />
              <TestimonialsColumn
                className="hidden md:block"
                duration={20}
                testimonials={secondColumn}
              />
              <TestimonialsColumn
                className="hidden lg:block"
                duration={18}
                testimonials={thirdColumn}
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="min-h-screen bg-linear-to-br from-sky-500 via-blue-600 to-indigo-700 py-20 px-4 md:px-8 flex items-center justify-center relative overflow-hidden">
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
