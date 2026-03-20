"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  Brain, Plus, Clock, Target, CheckCircle, XCircle,
  ArrowRight, BarChart3, Zap, TrendingUp
} from "lucide-react";
import { listReports, getMe } from "@/lib/api";

interface ReportSummary {
  report_id: number;
  session_id: number;
  job_role: string;
  company: string;
  overall_score: number;
  hire_decision: boolean;
  created_at: string;
}

export default function DashboardPage() {
  const { user } = useUser();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [userInfo, setUserInfo] = useState<{ plan: string; daily_interviews_used: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listReports(), getMe()])
      .then(([r, u]) => { setReports(r); setUserInfo(u); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const avgScore = reports.length > 0
    ? (reports.reduce((s, r) => s + r.overall_score, 0) / reports.length).toFixed(1)
    : "—";
  const hireRate = reports.length > 0
    ? Math.round((reports.filter((r) => r.hire_decision).length / reports.length) * 100)
    : 0;

  const scoreColor = (s: number) =>
    s >= 7 ? "var(--nf-green)" : s >= 5 ? "var(--nf-amber)" : "var(--nf-magenta)";

  return (
    <div style={{ minHeight: "100vh", background: "var(--nf-void)" }}>
      {/* ── Header ───────────────────────────────────────── */}
      <header className="nf-nav sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)" }}>
            <Brain className="w-4 h-4" style={{ color: "var(--nf-cyan)" }} />
          </div>
          <span className="nf-heading" style={{ color: "var(--nf-cyan)" }}>HIREMIND<span style={{ color: "var(--nf-text-3)", fontSize: "0.8em" }}>.AI</span></span>
        </div>

        <div className="flex items-center gap-3">
          {userInfo && (
            <span className="nf-badge nf-badge-cyan nf-mono">
              <span className="nf-dot nf-dot-cyan" style={{ width: 6, height: 6 }} />
              {userInfo.plan.toUpperCase()} · {userInfo.daily_interviews_used} today
            </span>
          )}
          <div className="w-9 h-9 rounded-lg flex items-center justify-center nf-heading"
            style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", color: "var(--nf-cyan)", fontSize: "0.85rem" }}>
            {user?.firstName?.[0] ?? "U"}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        {/* ── Welcome ─────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="nf-heading" style={{ fontSize: "1.8rem", marginBottom: "0.3rem" }}>
              Interface ready, <span className="nf-gradient-text">{user?.firstName ?? "Candidate"}</span>
            </h1>
            <p className="nf-mono" style={{ fontSize: "0.78rem", color: "var(--nf-text-3)", letterSpacing: "0.05em" }}>
              // Neural Interview Engine standing by
            </p>
          </div>
          <Link href="/interview/setup" className="nf-btn nf-btn-primary">
            <Plus className="w-4 h-4" /> New Session
          </Link>
        </div>

        {/* ── Stats Grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 nf-stagger">
          {[
            { icon: <BarChart3 className="w-5 h-5" />, label: "AVG_SCORE", value: `${avgScore}/10`, color: "var(--nf-cyan)", badge: "nf-badge-cyan" },
            { icon: <Target className="w-5 h-5" />,    label: "HIRE_RATE", value: `${hireRate}%`,  color: "var(--nf-green)", badge: "nf-badge-green" },
            { icon: <Clock className="w-5 h-5" />,     label: "SESSIONS",  value: reports.length, color: "var(--nf-violet)", badge: "nf-badge-violet" },
          ].map((s) => (
            <div key={s.label} className="nf-card p-6 flex items-center gap-4 nf-animate-up">
              <div className={`nf-badge ${s.badge}`} style={{ padding: "0.5rem", borderRadius: 8 }}>
                {s.icon}
              </div>
              <div>
                <p className="nf-mono" style={{ fontSize: "0.65rem", color: "var(--nf-text-3)", letterSpacing: "0.1em" }}>{s.label}</p>
                <p className="nf-heading" style={{ fontSize: "1.8rem", color: s.color, textShadow: `0 0 20px ${s.color}60` }}>
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Session History ─────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="nf-badge nf-badge-cyan" style={{ fontSize: "0.65rem" }}>HISTORY</span>
              <span className="nf-mono" style={{ fontSize: "0.75rem", color: "var(--nf-text-3)" }}>// interview_sessions[]</span>
            </div>
            {reports.length > 0 && (
              <span className="nf-mono" style={{ fontSize: "0.72rem", color: "var(--nf-text-3)" }}>{reports.length} records</span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="nf-skeleton" style={{ height: 72 }} />)}
            </div>
          ) : reports.length === 0 ? (
            <div className="nf-card p-16 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 nf-animate-float"
                style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)" }}>
                <Brain className="w-7 h-7" style={{ color: "rgba(0,212,255,0.4)" }} />
              </div>
              <p className="nf-heading mb-1" style={{ fontSize: "1rem" }}>No sessions yet</p>
              <p className="nf-mono mb-6" style={{ fontSize: "0.75rem", color: "var(--nf-text-3)" }}>// Begin your first neural interview session</p>
              <Link href="/interview/setup" className="nf-btn nf-btn-primary text-sm inline-flex">
                <Zap className="w-4 h-4" /> Start First Interview
              </Link>
            </div>
          ) : (
            <div className="space-y-3 nf-stagger">
              {reports.map((r) => (
                <Link key={r.report_id} href={`/report/${r.session_id}`}
                  className="nf-card nf-card-hover p-5 flex items-center gap-4 group block"
                  style={{ textDecoration: "none" }}>
                  {/* Verdict icon */}
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: r.hire_decision ? "rgba(0,255,136,0.08)" : "rgba(255,45,120,0.08)", border: `1px solid ${r.hire_decision ? "rgba(0,255,136,0.2)" : "rgba(255,45,120,0.2)"}` }}>
                    {r.hire_decision
                      ? <CheckCircle className="w-5 h-5" style={{ color: "var(--nf-green)" }} />
                      : <XCircle className="w-5 h-5" style={{ color: "var(--nf-magenta)" }} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="nf-heading" style={{ fontSize: "0.9rem" }}>{r.job_role}</p>
                    <p className="nf-mono" style={{ fontSize: "0.72rem", color: "var(--nf-text-3)" }}>
                      {r.company} · {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <p className="nf-heading" style={{ fontSize: "1.4rem", color: scoreColor(r.overall_score), textShadow: `0 0 12px ${scoreColor(r.overall_score)}60` }}>
                      {r.overall_score.toFixed(1)}
                    </p>
                    <p className="nf-mono" style={{ fontSize: "0.65rem", color: "var(--nf-text-3)" }}>out of 10</p>
                  </div>

                  <ArrowRight className="w-4 h-4 shrink-0 ml-1 transition-colors"
                    style={{ color: "var(--nf-border)" }} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick action strip */}
        <div className="nf-card p-4 mt-8 flex items-center gap-4">
          <TrendingUp className="w-5 h-5 shrink-0" style={{ color: "var(--nf-cyan)" }} />
          <p style={{ fontSize: "0.85rem", color: "var(--nf-text-2)" }}>
            Ready to improve? Start a new session targeting your weakest round.
          </p>
          <Link href="/interview/setup" className="nf-btn nf-btn-primary ml-auto text-xs shrink-0" style={{ padding: "0.5rem 1rem" }}>
            New Session <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
