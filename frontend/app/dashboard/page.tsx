"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  Brain, Plus, Clock, TrendingUp, Target,
  CheckCircle, XCircle, ArrowRight, BarChart3
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
    const load = async () => {
      try {
        const [r, u] = await Promise.all([listReports(), getMe()]);
        setReports(r);
        setUserInfo(u);
      } catch {
        // user may not be synced yet
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const avgScore =
    reports.length > 0
      ? (reports.reduce((s, r) => s + r.overall_score, 0) / reports.length).toFixed(1)
      : "—";

  const hireRate =
    reports.length > 0
      ? Math.round((reports.filter((r) => r.hire_decision).length / reports.length) * 100)
      : 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-1)" }}>
      {/* ── Header ────────────────────────────────────── */}
      <header className="glass border-b border-indigo-500/10 px-8 py-5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Brain className="w-7 h-7 text-indigo-400" />
          <span className="font-bold text-lg gradient-text">HireMind AI</span>
        </div>
        <div className="flex items-center gap-4">
          {userInfo && (
            <span className="glass px-3 py-1.5 rounded-full text-xs font-semibold text-indigo-300 capitalize">
              {userInfo.plan} plan · {userInfo.daily_interviews_used} today
            </span>
          )}
          <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-300">
            {user?.firstName?.[0] ?? "U"}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* ── Welcome ───────────────────────────────────── */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              Welcome back, <span className="gradient-text">{user?.firstName ?? "there"}</span> 👋
            </h1>
            <p className="text-slate-400">Ready to practice? Your next interview awaits.</p>
          </div>
          <Link href="/interview/setup" className="btn-primary">
            <Plus className="w-4 h-4" />
            New Interview
          </Link>
        </div>

        {/* ── Stats ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: <BarChart3 className="w-5 h-5" />, label: "Avg Score", value: `${avgScore}/10`, color: "text-indigo-400" },
            { icon: <Target className="w-5 h-5" />, label: "Hire Rate", value: `${hireRate}%`, color: "text-emerald-400" },
            { icon: <Clock className="w-5 h-5" />, label: "Total Sessions", value: reports.length, color: "text-violet-400" },
          ].map((s) => (
            <div key={s.label} className="glass p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center" style={{ color: "inherit" }}>
                <span className={s.color}>{s.icon}</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Recent Reports ────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold">Recent Interviews</h2>
            {reports.length > 0 && (
              <span className="text-slate-400 text-sm">{reports.length} total</span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="glass p-12 text-center">
              <Brain className="w-12 h-12 text-indigo-400/40 mx-auto mb-3" />
              <p className="text-slate-400 mb-2">No interviews yet</p>
              <p className="text-slate-500 text-sm mb-6">Start your first AI mock interview now.</p>
              <Link href="/interview/setup" className="btn-primary text-sm">
                <Plus className="w-4 h-4" /> Start Interview
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <Link
                  key={r.report_id}
                  href={`/report/${r.session_id}`}
                  className="glass glass-hover p-5 flex items-center gap-4 group block transition-all duration-200"
                >
                  {/* Hire decision icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${r.hire_decision ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                    {r.hire_decision
                      ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                      : <XCircle className="w-5 h-5 text-red-400" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{r.job_role} @ {r.company}</p>
                    <p className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <p className={`text-xl font-bold ${r.overall_score >= 7 ? "text-emerald-400" : r.overall_score >= 5 ? "text-amber-400" : "text-red-400"}`}>
                      {r.overall_score.toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-500">/ 10</p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors ml-2" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
