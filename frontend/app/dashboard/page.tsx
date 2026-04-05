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
    s >= 7 ? "var(--kz-moss)" : s >= 5 ? "var(--kz-gold)" : "var(--kz-coral)";

  return (
    <div className="min-h-screen">
      {/* ── Header ───────────────────────────────────────── */}
      <header className="nf-nav sticky top-0 z-40 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center bg-[var(--kz-straw)] border border-[var(--kz-ink)]">
            <Brain className="w-5 h-5 text-[var(--kz-teal)]" />
          </div>
          <span className="nf-heading text-lg tracking-tight text-[var(--kz-charcoal)]">
            HIREMIND<span className="text-[var(--kz-text-2)] font-light text-base">.ZEN</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {userInfo && (
            <span className="nf-badge nf-badge-cyan nf-mono text-[10px]">
              {userInfo.plan.toUpperCase()} · {userInfo.daily_interviews_used} TODAY
            </span>
          )}
          <div className="w-9 h-9 flex items-center justify-center nf-heading bg-[var(--kz-straw)] border border-[var(--kz-ink)] text-[var(--kz-teal)] text-sm">
            {user?.firstName?.[0] ?? "U"}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* ── Welcome ─────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-16">
          <div>
            <h1 className="nf-heading text-4xl mb-2">
              Interface ready, <span className="nf-gradient-text italic">{user?.firstName ?? "Candidate"}</span>
            </h1>
            <p className="nf-mono text-[10px] uppercase tracking-[0.2em] text-[var(--kz-text-3)]">
              // Zen Interview Engine standing by
            </p>
          </div>
          <Link href="/interview/setup" className="nf-btn nf-btn-primary">
            <Plus className="w-4 h-4" /> New Session
          </Link>
        </div>

        {/* ── Stats Grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16 nf-stagger">
          {[
            { icon: <BarChart3 className="w-5 h-5" />, label: "AVG_SCORE", value: `${avgScore}/10`, color: "var(--kz-teal)", badge: "nf-badge-cyan" },
            { icon: <Target className="w-5 h-5" />,    label: "HIRE_RATE", value: `${hireRate}%`,  color: "var(--kz-moss)", badge: "nf-badge-green" },
            { icon: <Clock className="w-5 h-5" />,     label: "SESSIONS",  value: reports.length, color: "var(--kz-charcoal)", badge: "nf-badge-violet" },
          ].map((s) => (
            <div key={s.label} className="nf-card p-8 flex items-center gap-6 nf-animate-in">
              <div className={`p-4 bg-[var(--kz-straw)] border border-[var(--kz-ink)] text-[var(--kz-teal)]`}>
                {s.icon}
              </div>
              <div>
                <p className="nf-mono text-[10px] tracking-[0.2em] text-[var(--kz-text-3)] mb-1">{s.label}</p>
                <p className="nf-heading text-3xl" style={{ color: s.color }}>
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Session History ─────────────────────────────── */}
        <div className="nf-animate-in">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="nf-badge nf-badge-cyan text-[10px]">HISTORY</span>
              <span className="nf-mono text-[10px] tracking-[0.1em] text-[var(--kz-text-3)]">// interview_sessions[]</span>
            </div>
            {reports.length > 0 && (
              <span className="nf-mono text-[10px] text-[var(--kz-text-3)]">{reports.length} records</span>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="nf-skeleton h-20" />)}
            </div>
          ) : reports.length === 0 ? (
            <div className="nf-card p-20 text-center border-[var(--kz-ink)]">
              <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6 bg-[var(--kz-straw)] border border-[var(--kz-ink)]">
                <Brain className="w-10 h-10 text-[var(--kz-teal)] opacity-40" />
              </div>
              <p className="nf-heading text-xl mb-2">No sessions yet</p>
              <p className="nf-mono text-xs text-[var(--kz-text-3)] mb-8 tracking-[0.1em]">// Begin your first zen interview session</p>
              <Link href="/interview/setup" className="nf-btn nf-btn-primary px-8">
                <Zap className="w-4 h-4" /> Start First Interview
              </Link>
            </div>
          ) : (
            <div className="space-y-4 nf-stagger">
              {reports.map((r) => (
                <Link key={r.report_id} href={`/report/${r.session_id}`}
                  className="nf-card nf-card-hover p-6 flex items-center gap-6 group">
                  {/* Verdict icon */}
                  <div className="w-12 h-12 flex items-center justify-center shrink-0 bg-[var(--kz-straw)] border border-[var(--kz-ink)]">
                    {r.hire_decision
                      ? <CheckCircle className="w-6 h-6 text-[var(--kz-moss)]" />
                      : <XCircle className="w-6 h-6 text-[var(--kz-coral)]" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="nf-heading text-lg text-[var(--kz-charcoal)]">{r.job_role}</p>
                    <p className="nf-mono text-xs text-[var(--kz-text-2)] tracking-tight">
                      {r.company} · {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0 pr-4">
                    <p className="nf-heading text-2xl" style={{ color: scoreColor(r.overall_score) }}>
                      {r.overall_score.toFixed(1)}
                    </p>
                    <p className="nf-mono text-[9px] text-[var(--kz-text-3)] tracking-[0.1em]">SCORE</p>
                  </div>

                  <ArrowRight className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1 text-[var(--kz-text-3)]" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick action strip */}
        <div className="nf-card p-6 mt-12 flex items-center gap-6 border-[var(--kz-ink)] bg-white/30 backdrop-blur-sm">
          <div className="w-10 h-10 flex items-center justify-center bg-[var(--kz-straw)] border border-[var(--kz-ink)]">
            <TrendingUp className="w-5 h-5 text-[var(--kz-teal)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--kz-text-1)] font-medium">Continuous Improvement</p>
            <p className="text-xs text-[var(--kz-text-3)]">Ready to improve? Start a new session targeting your weakest round.</p>
          </div>
          <Link href="/interview/setup" className="nf-btn nf-btn-primary ml-auto text-xs py-2 px-6">
            New Session
          </Link>
        </div>
      </div>
    </div>
  );
}
