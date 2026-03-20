"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Brain, CheckCircle, XCircle, TrendingUp, AlertTriangle,
  ArrowLeft, BarChart3, Lightbulb, Terminal, Zap
} from "lucide-react";
import { getReport } from "@/lib/api";

interface RoundBreakdown {
  round_type: string;
  average_score: number;
  questions_answered: number;
}

interface Report {
  id: number;
  session_id: number;
  overall_score: number;
  hire_decision: boolean;
  strengths: string[];
  weaknesses: string[];
  improvement_roadmap: string[];
  round_breakdown: RoundBreakdown[];
}

function NeonScoreRing({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? "var(--nf-green)" : score >= 5 ? "var(--nf-amber)" : "var(--nf-magenta)";
  const glow  = score >= 7 ? "var(--glow-green)" : score >= 5 ? "var(--glow-amber)" : "var(--glow-magenta)";
  return (
    <div className="nf-score-ring" style={{ "--pct": pct, "--ring-color": color, boxShadow: glow } as React.CSSProperties}>
      <span className="nf-heading" style={{ fontSize: "1.3rem", color, textShadow: `0 0 20px ${color}` }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

export default function ReportPage() {
  const params = useParams();
  const sessionId = Number(params.id);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReport(sessionId)
      .then(setReport)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <div className="nf-animate-spin" style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid var(--nf-border)", borderTopColor: "var(--nf-cyan)", boxShadow: "var(--glow-cyan)" }} />
        <p className="nf-mono" style={{ fontSize: "0.78rem", color: "var(--nf-text-3)" }}>// loading report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <AlertTriangle className="w-10 h-10" style={{ color: "var(--nf-magenta)" }} />
        <p style={{ color: "var(--nf-text-2)" }}>Report not found. Complete the interview first.</p>
        <Link href="/dashboard" className="nf-btn nf-btn-secondary text-sm">Back to Dashboard</Link>
      </div>
    );
  }

  const scoreColor = (s: number) =>
    s >= 7 ? "var(--nf-green)" : s >= 5 ? "var(--nf-amber)" : "var(--nf-magenta)";

  return (
    <div style={{ minHeight: "100vh", background: "var(--nf-void)", padding: "2.5rem 1.5rem" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Back */}
        <Link href="/dashboard" className="flex items-center gap-2 nf-mono mb-8 transition-colors"
          style={{ fontSize: "0.75rem", color: "var(--nf-text-3)", textDecoration: "none", width: "fit-content" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> cd ~/dashboard
        </Link>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          <Brain className="w-4 h-4" style={{ color: "var(--nf-cyan)" }} />
          <span className="nf-heading" style={{ color: "var(--nf-cyan)", fontSize: "0.9rem" }}>HIREMIND.AI</span>
          <span style={{ color: "var(--nf-border)" }}>/</span>
          <span className="nf-mono" style={{ fontSize: "0.72rem", color: "var(--nf-text-3)" }}>report[{sessionId}]</span>
        </div>

        {/* ── Verdict Card ─────────────────────────────────────────── */}
        <div className="nf-card p-8 mb-6 nf-animate-up" style={{
          borderColor: report.hire_decision ? "rgba(0,255,136,0.35)" : "rgba(255,45,120,0.35)",
          boxShadow: report.hire_decision ? "var(--glow-green)" : "var(--glow-magenta)",
        }}>
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Score ring */}
            <div className="flex flex-col items-center gap-2">
              <NeonScoreRing score={report.overall_score} />
              <p className="nf-mono" style={{ fontSize: "0.65rem", color: "var(--nf-text-3)" }}>OVERALL</p>
            </div>

            {/* Verdict text */}
            <div className="flex flex-col gap-3 text-center md:text-left flex-1">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <div className={`nf-badge nf-mono`} style={{
                  fontSize: "0.85rem",
                  padding: "0.5rem 1.25rem",
                  background: report.hire_decision ? "rgba(0,255,136,0.1)" : "rgba(255,45,120,0.1)",
                  color: report.hire_decision ? "var(--nf-green)" : "var(--nf-magenta)",
                  border: `1px solid ${report.hire_decision ? "rgba(0,255,136,0.3)" : "rgba(255,45,120,0.3)"}`,
                  boxShadow: report.hire_decision ? "var(--glow-green)" : "var(--glow-magenta)",
                }}>
                  {report.hire_decision ? <><CheckCircle className="w-4 h-4" /> HIRE — STRONG CANDIDATE</> : <><XCircle className="w-4 h-4" /> NO HIRE — KEEP TRAINING</>}
                </div>
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--nf-text-2)", lineHeight: 1.6 }}>
                {report.hire_decision
                  ? "Your performance cleared the bar. You demonstrated strong technical depth and clear communication."
                  : "You have clear growth areas. Focus on the improvement roadmap below and try again."}
              </p>
            </div>
          </div>
        </div>

        {/* ── Round Breakdown ──────────────────────────────────────── */}
        {report.round_breakdown?.length > 0 && (
          <div className="nf-card p-6 mb-5 nf-animate-up" style={{ animationDelay: "80ms" }}>
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-4 h-4" style={{ color: "var(--nf-cyan)" }} />
              <span className="nf-badge nf-badge-cyan nf-mono" style={{ fontSize: "0.65rem" }}>ROUND_BREAKDOWN</span>
            </div>
            <div className="space-y-5">
              {report.round_breakdown.map((r) => {
                const pct = (r.average_score / 10) * 100;
                const col = scoreColor(r.average_score);
                return (
                  <div key={r.round_type}>
                    <div className="flex justify-between mb-2">
                      <span className="nf-mono" style={{ fontSize: "0.78rem", color: "var(--nf-text-2)" }}>{r.round_type}</span>
                      <span className="nf-mono" style={{ fontSize: "0.72rem", color: col }}>
                        {r.average_score.toFixed(1)}/10 · {r.questions_answered} Q
                      </span>
                    </div>
                    <div className="nf-progress-track">
                      <div className="nf-progress-fill" style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${col}, ${col}99)`,
                        boxShadow: `0 0 10px ${col}60`,
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Strengths + Weaknesses ───────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <div className="nf-card p-6 nf-card-green nf-animate-up" style={{ animationDelay: "160ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-4 h-4" style={{ color: "var(--nf-green)" }} />
              <span className="nf-badge nf-badge-green nf-mono" style={{ fontSize: "0.62rem" }}>STRENGTHS</span>
            </div>
            <ul className="space-y-3">
              {(report.strengths || []).map((s, i) => (
                <li key={i} className="flex items-start gap-2" style={{ fontSize: "0.875rem", color: "var(--nf-text-2)" }}>
                  <span className="nf-mono" style={{ color: "var(--nf-green)", marginTop: "0.1rem", flexShrink: 0 }}>✓</span> {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="nf-card p-6 nf-card-magenta nf-animate-up" style={{ animationDelay: "240ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4" style={{ color: "var(--nf-magenta)" }} />
              <span className="nf-badge nf-badge-magenta nf-mono" style={{ fontSize: "0.62rem" }}>WEAKNESSES</span>
            </div>
            <ul className="space-y-3">
              {(report.weaknesses || []).map((w, i) => (
                <li key={i} className="flex items-start gap-2" style={{ fontSize: "0.875rem", color: "var(--nf-text-2)" }}>
                  <span className="nf-mono" style={{ color: "var(--nf-magenta)", marginTop: "0.1rem", flexShrink: 0 }}>✗</span> {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Improvement Roadmap ──────────────────────────────────── */}
        {(report.improvement_roadmap || []).length > 0 && (
          <div className="nf-card p-6 mb-8 nf-animate-up" style={{ animationDelay: "320ms" }}>
            <div className="flex items-center gap-2 mb-5">
              <Lightbulb className="w-4 h-4" style={{ color: "var(--nf-amber)" }} />
              <span className="nf-badge nf-badge-amber nf-mono" style={{ fontSize: "0.62rem" }}>IMPROVEMENT_ROADMAP</span>
            </div>
            <ol className="space-y-4">
              {report.improvement_roadmap.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="nf-heading nf-gradient-text shrink-0" style={{ fontSize: "1.2rem", lineHeight: 1.2 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p style={{ fontSize: "0.875rem", color: "var(--nf-text-2)", lineHeight: 1.6 }}>{item}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 nf-animate-up" style={{ animationDelay: "400ms" }}>
          <Link href="/interview/setup" className="nf-btn nf-btn-primary" style={{ flex: 1, justifyContent: "center", padding: "0.9rem" }}>
            <Zap className="w-4 h-4" /> Practice Again
          </Link>
          <Link href="/dashboard" className="nf-btn nf-btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "0.9rem" }}>
            <TrendingUp className="w-4 h-4" /> View Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
