"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { Brain, Zap, Target, TrendingUp, CheckCircle, ArrowRight, Mic, Code2, BarChart3 } from "lucide-react";

const COMPANIES = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Stripe"];

const FEATURES = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: "Resume-Aware Questions",
    description: "AI reads your resume and asks questions directly relevant to your skills and experience.",
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: "Company Simulation",
    description: "Interviews that think like Google, Amazon, Microsoft — bar-raiser precision.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Adaptive Difficulty",
    description: "Questions get harder when you perform well, easier when you struggle — just like real interviews.",
  },
  {
    icon: <Mic className="w-6 h-6" />,
    title: "Voice Mode",
    description: "Speak your answers naturally. Built on Whisper for accurate transcription.",
  },
  {
    icon: <Code2 className="w-6 h-6" />,
    title: "Code Editor",
    description: "Solve DSA problems in an embedded Monaco editor — same setup as real interviews.",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Detailed Reports",
    description: "Hire / No-Hire decision with score breakdown, strengths, weaknesses, and improvement roadmap.",
  },
];

const STEPS = [
  { step: "01", title: "Upload Your Resume", desc: "AI extracts skills, experience, and weak areas automatically." },
  { step: "02", title: "Choose Role & Company", desc: "Select target company and job role. We simulate their exact interview style." },
  { step: "03", title: "Start Interview", desc: "AI conducts multi-round interview: DSA → System Design → Behavioral." },
  { step: "04", title: "Get Your Report", desc: "Receive detailed feedback, score, and improvement roadmap." },
];

export default function LandingPage() {
  const { isSignedIn } = useUser();

  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-indigo-500/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-7 h-7 text-indigo-400" />
          <span className="text-xl font-bold gradient-text">HireMind AI</span>
        </div>
        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <Link href="/dashboard" className="btn-primary text-sm py-2 px-5">
              Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="btn-secondary text-sm py-2 px-5">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn-primary text-sm py-2 px-5">Get Started Free</button>
              </SignUpButton>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative pt-36 pb-28 px-6 text-center overflow-hidden">
        {/* Glow background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto animate-fade-up">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-indigo-300 mb-6">
            <Zap className="w-4 h-4" /> AI-powered mock interviews that adapt to YOUR resume
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            Ace Your Next Interview with{" "}
            <span className="gradient-text">AI That Thinks</span>{" "}
            Like Your Interviewer
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            HireMind simulates real hiring pipelines from Google, Amazon, and Microsoft —
            personalized to your resume, job description, and target role.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isSignedIn ? (
              <Link href="/interview/setup" className="btn-primary text-lg py-4 px-8">
                Start Interview <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <SignUpButton mode="modal">
                <button className="btn-primary text-lg py-4 px-8">
                  Start Free — No Credit Card <ArrowRight className="w-5 h-5" />
                </button>
              </SignUpButton>
            )}
            <Link href="#how-it-works" className="btn-secondary text-lg py-4 px-8">
              See How It Works
            </Link>
          </div>

          {/* Company logos */}
          <div className="mt-14">
            <p className="text-slate-500 text-sm mb-4">Simulates interviews from</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {COMPANIES.map((c) => (
                <span key={c} className="glass px-4 py-2 rounded-full text-sm font-semibold text-slate-300">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Not random questions. <span className="gradient-text">Real intelligence.</span>
          </h2>
          <p className="text-slate-400 text-lg">Every feature built to get you hired.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass glass-hover p-6 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-slate-400 text-lg">Four steps to interview readiness.</p>
        </div>

        <div className="space-y-4">
          {STEPS.map((s, i) => (
            <div key={s.step} className="glass p-6 flex items-start gap-6 glass-hover transition-all duration-300">
              <span className="text-4xl font-black gradient-text shrink-0">{s.step}</span>
              <div>
                <h3 className="text-xl font-bold mb-1">{s.title}</h3>
                <p className="text-slate-400">{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight className="w-5 h-5 text-indigo-400 ml-auto shrink-0 mt-1" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────── */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-4">Start Free, Scale When Ready</h2>
        <p className="text-slate-400 mb-12">No credit card required to get started.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="glass p-8 text-left">
            <h3 className="text-xl font-bold mb-2">Free</h3>
            <p className="text-4xl font-black mb-6">$0<span className="text-slate-500 text-base font-normal">/mo</span></p>
            <ul className="space-y-3 text-slate-300">
              {["2 interviews/day", "All round types", "Basic feedback", "Voice mode"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <SignUpButton mode="modal">
              <button className="btn-secondary w-full mt-6 justify-center">Get Started Free</button>
            </SignUpButton>
          </div>

          {/* Pro */}
          <div className="glass p-8 text-left border border-indigo-500/40 relative">
            <span className="absolute -top-3 left-6 badge bg-indigo-500 text-white border-0 text-xs">MOST POPULAR</span>
            <h3 className="text-xl font-bold mb-2">Pro</h3>
            <p className="text-4xl font-black mb-6 gradient-text">$19<span className="text-slate-500 text-base font-normal">/mo</span></p>
            <ul className="space-y-3 text-slate-300">
              {[
                "Unlimited interviews",
                "Company-specific simulation",
                "Advanced AI evaluation",
                "PDF reports",
                "Priority support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <SignUpButton mode="modal">
              <button className="btn-primary w-full mt-6 justify-center">Upgrade to Pro</button>
            </SignUpButton>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-8 px-6 text-center text-slate-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-white">HireMind AI</span>
        </div>
        Built for candidates who refuse to settle. © {new Date().getFullYear()} HireMind
      </footer>
    </main>
  );
}
