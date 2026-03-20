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
    accent: "cyan",
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
    accent: "magenta",
  },
  {
    icon: <Mic className="w-5 h-5" />,
    title: "Voice Mode",
    description: "Speak your answers. Whisper AI transcribes with near-human accuracy.",
    accent: "cyan",
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
    accent: "amber",
  },
];

const STEPS = [
  { step: "01", title: "Upload Resume", desc: "AI extracts skills, experience level, and weak areas in seconds." },
  { step: "02", title: "Choose Role & Company", desc: "Pick your target company. We simulate their exact interview format." },
  { step: "03", title: "Enter the Neural Interview", desc: "Multi-round adaptive AI interview: DSA → System Design → Behavioral." },
  { step: "04", title: "Get Your Report", desc: "Hire/No-Hire verdict with a personalized improvement roadmap." },
];

const ACCENT_MAP: Record<string, string> = {
  cyan:   "nf-badge-cyan",
  violet: "nf-badge-violet",
  magenta:"nf-badge-magenta",
  amber:  "nf-badge-amber",
};

export default function LandingPage() {
  const { isSignedIn } = useUser();

  return (
    <main style={{ background: "var(--nf-void)", minHeight: "100vh", overflowX: "hidden" }}>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="nf-nav fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between" style={{ position: "fixed" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.3)", boxShadow: "var(--glow-cyan)" }}>
            <Brain className="w-4 h-4" style={{ color: "var(--nf-cyan)" }} />
          </div>
          <span className="nf-heading text-lg" style={{ color: "var(--nf-cyan)", textShadow: "0 0 20px rgba(0,212,255,0.5)" }}>
            HIREMIND<span style={{ color: "var(--nf-text-2)", fontSize: "0.8em" }}>.AI</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <Link href="/dashboard" className="nf-btn nf-btn-primary text-xs py-2 px-5">
              Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="nf-btn nf-btn-ghost text-xs py-2 px-4">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="nf-btn nf-btn-primary text-xs py-2 px-5">
                  Start Free <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="nf-section-glow relative pt-40 pb-28 px-6 text-center">
        {/* Ambient glows */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 700, height: 500, background: "radial-gradient(ellipse, rgba(0,212,255,0.06) 0%, transparent 65%)" }} />
          <div style={{ position: "absolute", top: "30%", left: "25%", width: 400, height: 400, background: "radial-gradient(ellipse, rgba(191,90,242,0.05) 0%, transparent 65%)" }} />
          <div style={{ position: "absolute", top: "35%", right: "20%", width: 350, height: 350, background: "radial-gradient(ellipse, rgba(255,45,120,0.04) 0%, transparent 65%)" }} />
        </div>

        <div className="relative max-w-5xl mx-auto nf-animate-up nf-stagger" style={{ zIndex: 1 }}>
          {/* Tag */}
          <div className="inline-flex items-center gap-2 nf-card px-4 py-2 rounded-full mb-8 nf-animate-up" style={{ borderRadius: 999 }}>
            <div className="nf-dot nf-dot-cyan animate-pulse" />
            <span className="nf-mono text-xs" style={{ color: "var(--nf-cyan)" }}>
              NEURAL INTERVIEW ENGINE v2.0
            </span>
          </div>

          {/* Headline */}
          <h1 className="nf-heading nf-animate-up" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", lineHeight: 1.05, marginBottom: "1.5rem" }}>
            Interview Like a{" "}
            <span className="nf-gradient-text">FAANG Candidate</span>
            <br />Not Like a Leetcode Grinder
          </h1>

          <p className="nf-animate-up" style={{ fontSize: "1.15rem", color: "var(--nf-text-2)", maxWidth: 580, margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
            HireMind reads your resume, simulates the exact hiring style of your target company,
            and adapts every question to your live performance.
          </p>

          {/* CTA Row */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center nf-animate-up">
            {isSignedIn ? (
              <Link href="/interview/setup" className="nf-btn nf-btn-primary" style={{ fontSize: "1rem", padding: "0.9rem 2rem" }}>
                <Terminal className="w-4 h-4" /> Launch Interview Engine <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <SignUpButton mode="modal">
                <button className="nf-btn nf-btn-primary" style={{ fontSize: "1rem", padding: "0.9rem 2rem" }}>
                  <Terminal className="w-4 h-4" /> Start Free — No Card Required <ArrowRight className="w-4 h-4" />
                </button>
              </SignUpButton>
            )}
            <Link href="#how-it-works" className="nf-btn nf-btn-secondary" style={{ fontSize: "1rem", padding: "0.9rem 2rem" }}>
              See How It Works
            </Link>
          </div>

          {/* Company pills */}
          <div className="nf-animate-up" style={{ marginTop: "3.5rem" }}>
            <p className="nf-mono" style={{ fontSize: "0.7rem", color: "var(--nf-text-3)", letterSpacing: "0.15em", marginBottom: "0.75rem" }}>
              SIMULATES INTERVIEWS FROM
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {COMPANIES.map((c) => (
                <span key={c} className="nf-card nf-badge" style={{ fontSize: "0.8rem", padding: "0.35rem 0.9rem", borderRadius: 6, color: "var(--nf-text-2)" }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="text-center mb-14">
          <span className="nf-badge nf-badge-cyan mb-3" style={{ display: "inline-flex" }}>CAPABILITIES</span>
          <h2 className="nf-heading" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", marginTop: "0.5rem" }}>
            Not random questions.{" "}
            <span className="nf-gradient-text">Real intelligence.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 nf-stagger">
          {FEATURES.map((f) => (
            <div key={f.title} className={`nf-card nf-card-hover p-6 ${f.accent === "magenta" ? "nf-card-magenta" : ""}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`nf-badge ${ACCENT_MAP[f.accent]}`} style={{ padding: "0.4rem" }}>
                  {f.icon}
                </div>
                <h3 className="nf-heading" style={{ fontSize: "1rem" }}>{f.title}</h3>
              </div>
              <p style={{ fontSize: "0.875rem", color: "var(--nf-text-2)", lineHeight: 1.65 }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6" style={{ maxWidth: 750, margin: "0 auto" }}>
        <div className="text-center mb-14">
          <span className="nf-badge nf-badge-violet mb-3" style={{ display: "inline-flex" }}>PROCESS</span>
          <h2 className="nf-heading" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", marginTop: "0.5rem" }}>
            Four steps to readiness
          </h2>
        </div>

        <div className="space-y-4 nf-stagger">
          {STEPS.map((s, i) => (
            <div key={s.step} className="nf-card nf-card-hover p-6 flex items-start gap-5">
              <span className="nf-heading nf-gradient-text shrink-0" style={{ fontSize: "2.5rem", lineHeight: 1 }}>{s.step}</span>
              <div className="flex-1">
                <h3 className="nf-heading mb-1" style={{ fontSize: "1.05rem" }}>{s.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--nf-text-2)" }}>{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && <ArrowRight className="w-4 h-4 shrink-0 mt-1" style={{ color: "var(--nf-cyan)" }} />}
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────── */}
      <section className="py-24 px-6 text-center" style={{ maxWidth: 850, margin: "0 auto" }}>
        <span className="nf-badge nf-badge-amber mb-3" style={{ display: "inline-flex" }}>PRICING</span>
        <h2 className="nf-heading" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", marginTop: "0.5rem", marginBottom: "3rem" }}>
          Start free. Upgrade when ready.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Free */}
          <div className="nf-card p-8 text-left">
            <p className="nf-mono text-xs mb-2" style={{ color: "var(--nf-text-3)", letterSpacing: "0.1em" }}>FREE TIER</p>
            <h3 className="nf-heading" style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Explorer</h3>
            <p className="nf-heading nf-gradient-text" style={{ fontSize: "2.5rem", marginBottom: "1.5rem" }}>
              $0<span style={{ fontSize: "1rem", color: "var(--nf-text-3)" }}>/mo</span>
            </p>
            <ul className="space-y-3" style={{ marginBottom: "1.5rem" }}>
              {["2 interviews/day", "All round types (DSA / SD / Behavioral)", "Basic AI evaluation", "Voice mode included"].map((f) => (
                <li key={f} className="flex items-center gap-2" style={{ fontSize: "0.875rem", color: "var(--nf-text-2)" }}>
                  <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "var(--nf-green)" }} /> {f}
                </li>
              ))}
            </ul>
            <SignUpButton mode="modal">
              <button className="nf-btn nf-btn-secondary w-full" style={{ justifyContent: "center" }}>Get Started Free</button>
            </SignUpButton>
          </div>

          {/* Pro */}
          <div className="nf-card p-8 text-left" style={{ borderColor: "rgba(0,212,255,0.35)", boxShadow: "var(--glow-cyan)" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="nf-mono text-xs" style={{ color: "var(--nf-cyan)", letterSpacing: "0.1em" }}>PRO TIER</p>
              <span className="nf-badge nf-badge-cyan">MOST POPULAR</span>
            </div>
            <h3 className="nf-heading" style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Neural Pro</h3>
            <p className="nf-heading nf-gradient-text" style={{ fontSize: "2.5rem", marginBottom: "1.5rem" }}>
              $19<span style={{ fontSize: "1rem", color: "var(--nf-text-3)" }}>/mo</span>
            </p>
            <ul className="space-y-3" style={{ marginBottom: "1.5rem" }}>
              {[
                "Unlimited interviews",
                "Company-specific simulation (Google, Amazon...)",
                "Full FAANG-grade evaluation rubric",
                "Adaptive difficulty engine",
                "PDF reports + interview history",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2" style={{ fontSize: "0.875rem", color: "var(--nf-text-2)" }}>
                  <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "var(--nf-cyan)" }} /> {f}
                </li>
              ))}
            </ul>
            <SignUpButton mode="modal">
              <button className="nf-btn nf-btn-primary w-full" style={{ justifyContent: "center" }}>Upgrade to Neural Pro</button>
            </SignUpButton>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--nf-border)", padding: "2rem 1.5rem", textAlign: "center" }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain className="w-4 h-4" style={{ color: "var(--nf-cyan)" }} />
          <span className="nf-heading" style={{ color: "var(--nf-cyan)" }}>HIREMIND.AI</span>
        </div>
        <p className="nf-mono" style={{ fontSize: "0.72rem", color: "var(--nf-text-3)" }}>
          © {new Date().getFullYear()} HireMind — Built for candidates who refuse to settle.
        </p>
      </footer>
    </main>
  );
}
