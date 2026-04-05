"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { Brain, Zap, Target, TrendingUp, CheckCircle, ArrowRight, Mic, Code2, BarChart3, Terminal } from "lucide-react";

const COMPANIES = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Stripe"];

const FEATURES = [
  {
    icon: <Brain className="w-5 h-5" />,
    title: "Resume-Aware",
    description: "AI reads your resume and crafts questions targeting your exact skills and gaps.",
    accent: "teal",
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: "Company Simulation",
    description: "Simulates Google bar-raisers, Amazon LP rounds, and Meta speed-coding formats.",
    accent: "violet",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Adaptive Difficulty",
    description: "Performs well → harder questions. Struggles → intelligent progression. Live feedback.",
    accent: "coral",
  },
  {
    icon: <Mic className="w-5 h-5" />,
    title: "Voice Mode",
    description: "Speak your answers. Whisper AI transcribes with near-human accuracy.",
    accent: "teal",
  },
  {
    icon: <Code2 className="w-5 h-5" />,
    title: "Code Editor",
    description: "Embedded Monaco editor for DSA problems. Syntax-highlighted, real-time.",
    accent: "violet",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Hire-Grade Reports",
    description: "Hire / No-Hire verdict + FAANG-rubric breakdown, strengths, and roadmap.",
    accent: "gold",
  },
];

const STEPS = [
  { step: "01", title: "Upload Resume", desc: "AI extracts skills, experience level, and weak areas in seconds." },
  { step: "02", title: "Choose Role & Company", desc: "Pick your target company. We simulate their exact interview format." },
  { step: "03", title: "Enter the Zen Interview", desc: "Multi-round adaptive AI interview: DSA → System Design → Behavioral." },
  { step: "04", title: "Get Your Report", desc: "Hire/No-Hire verdict with a personalized improvement roadmap." },
];

const ACCENT_MAP: Record<string, string> = {
  teal:   "nf-badge-cyan", // aliased to kz-teal
  violet: "nf-badge-violet",
  coral:  "nf-badge-magenta", // aliased to kz-coral
  gold:   "nf-badge-amber", // aliased to kz-gold
};

export default function LandingPage() {
  const { isSignedIn } = useUser();

  return (
    <main className="min-h-screen relative">

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="nf-nav fixed top-0 w-full z-50 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center bg-[var(--kz-straw)] border border-[var(--kz-ink)]">
            <Brain className="w-5 h-5 text-[var(--kz-teal)]" />
          </div>
          <span className="nf-heading text-xl tracking-tight text-[var(--kz-charcoal)]">
            HIREMIND<span className="text-[var(--kz-text-2)] font-light text-base">.ZEN</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <Link href="/dashboard" className="nf-btn nf-btn-primary text-xs">
              Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="nf-btn nf-btn-ghost text-xs">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="nf-btn nf-btn-primary text-xs">
                  Start Free <ArrowRight className="w-4 h-4" />
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative pt-48 pb-32 px-6 text-center">
        <div className="relative max-w-5xl mx-auto nf-animate-in nf-stagger z-10">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 nf-card px-5 py-2.5 mb-10 nf-animate-in border-[var(--kz-ink)]">
            <div className="w-2 h-2 rounded-full bg-[var(--kz-teal)] opacity-60" />
            <span className="nf-mono text-[10px] uppercase tracking-[0.2em] text-[var(--kz-teal)]">
              Kyoto Zen Interview Engine v3.0
            </span>
          </div>

          {/* Headline */}
          <h1 className="nf-heading nf-animate-in mb-8" style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)", lineHeight: 1.0, color: "var(--kz-charcoal)" }}>
            Interview with <span className="nf-gradient-text italic font-normal">Absolute Focus.</span>
            <br />Built for FAANG candidates.
          </h1>

          <p className="nf-animate-in text-lg md:text-xl text-[var(--kz-text-2)] max-w-2xl mx-auto mb-12 leading-relaxed">
            HireMind reads your resume, simulates the exact hiring style of your target company,
            and adapts every question to your live performance.
          </p>

          {/* CTA Row */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center nf-animate-in">
            {isSignedIn ? (
              <Link href="/interview/setup" className="nf-btn nf-btn-primary py-4 px-10">
                <Terminal className="w-4 h-4" /> Launch Zen Engine <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <SignUpButton mode="modal">
                <button className="nf-btn nf-btn-primary py-4 px-10">
                  <Terminal className="w-4 h-4" /> Start Free — No Card Required <ArrowRight className="w-4 h-4" />
                </button>
              </SignUpButton>
            )}
            <Link href="#how-it-works" className="nf-btn nf-btn-secondary py-4 px-10">
              See How It Works
            </Link>
          </div>

          {/* Company pills */}
          <div className="nf-animate-in mt-20 opacity-70">
            <p className="nf-mono text-[10px] uppercase tracking-[0.25em] text-[var(--kz-text-3)] mb-6">
              Simulating Interviews From
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {COMPANIES.map((c) => (
                <span key={c} className="nf-card px-5 py-2 text-sm text-[var(--kz-text-2)] border-[var(--kz-ink)]">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section className="py-32 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <span className="nf-badge nf-badge-cyan mb-4">CAPABILITIES</span>
          <h2 className="nf-heading text-4xl md:text-5xl">
            Not random questions. <span className="nf-gradient-text">Pure focus.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 nf-stagger">
          {FEATURES.map((f) => (
            <div key={f.title} className="nf-card nf-card-hover p-8 group">
              <div className="flex items-center gap-4 mb-5">
                <div className={`p-3 bg-[var(--kz-straw)] border border-[var(--kz-ink)] text-[var(--kz-teal)]`}>
                  {f.icon}
                </div>
                <h3 className="nf-heading text-lg">{f.title}</h3>
              </div>
              <p className="text-sm text-[var(--kz-text-2)] leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────── */}
      <section id="how-it-works" className="py-32 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-20">
          <span className="nf-badge nf-badge-violet mb-4">PROCESS</span>
          <h2 className="nf-heading text-4xl md:text-5xl">Our Zen Methodology</h2>
        </div>

        <div className="space-y-6 nf-stagger">
          {STEPS.map((s, i) => (
            <div key={s.step} className="nf-card nf-card-hover p-8 flex items-start gap-8">
              <span className="nf-heading nf-gradient-text text-5xl leading-none opacity-20">{s.step}</span>
              <div className="flex-1 pt-1">
                <h3 className="nf-heading text-xl mb-2">{s.title}</h3>
                <p className="text-[var(--kz-text-2)] leading-relaxed">{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && <ArrowRight className="w-5 h-5 shrink-0 mt-4 opacity-30" />}
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────── */}
      <section className="py-32 px-6 text-center max-w-5xl mx-auto">
        <span className="nf-badge nf-badge-amber mb-4">PRICING</span>
        <h2 className="nf-heading text-4xl md:text-5xl mb-20">Focus on Growth, Not Cost.</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free */}
          <div className="nf-card p-10 text-left border-[var(--kz-ink)]">
            <p className="nf-mono text-[10px] tracking-[0.2em] text-[var(--kz-text-3)] mb-3">FREE TIER</p>
            <h3 className="nf-heading text-2xl mb-2">The Explorer</h3>
            <p className="nf-heading nf-gradient-text text-5xl mb-8">
              $0<span className="text-lg font-normal text-[var(--kz-text-3)]">/mo</span>
            </p>
            <ul className="space-y-4 mb-10">
              {["2 interviews/day", "All round types (DSA / SD / Behavioral)", "Basic AI evaluation", "Voice mode included"].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-[var(--kz-text-2)]">
                  <CheckCircle className="w-4 h-4 text-[var(--kz-moss)]" /> {f}
                </li>
              ))}
            </ul>
            <SignUpButton mode="modal">
              <button className="nf-btn nf-btn-secondary w-full">Get Started Free</button>
            </SignUpButton>
          </div>

          {/* Pro */}
          <div className="nf-card p-10 text-left border-[var(--kz-teal)] bg-white/40">
            <div className="flex items-center justify-between mb-3">
              <p className="nf-mono text-[10px] tracking-[0.2em] text-[var(--kz-teal)]">PRO TIER</p>
              <span className="nf-badge nf-badge-cyan">MOST POPULAR</span>
            </div>
            <h3 className="nf-heading text-2xl mb-2">Neural Zen Pro</h3>
            <p className="nf-heading nf-gradient-text text-5xl mb-8">
              $19<span className="text-lg font-normal text-[var(--kz-text-3)]">/mo</span>
            </p>
            <ul className="space-y-4 mb-10">
              {[
                "Unlimited interviews",
                "Company-specific simulation",
                "Full FAANG evaluation rubric",
                "Adaptive difficulty engine",
                "Personalized Roadmap",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-[var(--kz-text-2)]">
                  <CheckCircle className="w-4 h-4 text-[var(--kz-teal)]" /> {f}
                </li>
              ))}
            </ul>
            <SignUpButton mode="modal">
              <button className="nf-btn nf-btn-primary w-full">Upgrade to Zen Pro</button>
            </SignUpButton>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="py-16 border-t border-[var(--kz-ink)] text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-[var(--kz-teal)]" />
          <span className="nf-heading text-lg tracking-tight text-[var(--kz-charcoal)]">HIREMIND.ZEN</span>
        </div>
        <p className="nf-mono text-[10px] text-[var(--kz-text-3)]">
          © {new Date().getFullYear()} HireMind — Built for the focused candidate.
        </p>
      </footer>
    </main>
  );
}
