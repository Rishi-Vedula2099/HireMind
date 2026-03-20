"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Brain, CheckCircle, XCircle, TrendingUp, AlertCircle,
  ArrowLeft, BarChart3, BookOpen, Lightbulb
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

function ScoreMeter({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? "#4ade80" : score >= 5 ? "#fbbf24" : "#f87171";
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="score-ring text-2xl font-black"
        style={{ ["--pct" as string]: pct, color } as React.CSSProperties}
      >
        <span>{score.toFixed(1)}</span>
      </div>
      <p className="text-slate-400 text-sm">Overall Score</p>
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Brain className="w-10 h-10 text-indigo-400 animate-pulse" />
        <p className="text-slate-400">Loading your report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-400">Report not found. Complete the interview first.</p>
        <Link href="/dashboard" className="btn-primary text-sm">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10 max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      {/* Verdict Banner */}
      <div className={`glass p-8 mb-8 rounded-2xl border ${report.hire_decision ? "border-emerald-500/30" : "border-red-500/30"}`}>
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Score meter */}
          <ScoreMeter score={report.overall_score} />

          {/* Verdict */}
          <div className="flex-1 text-center md:text-left">
            <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold text-lg mb-3 ${report.hire_decision ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20" : "bg-red-500/15 text-red-300 border border-red-500/20"}`}>
              {report.hire_decision
                ? <><CheckCircle className="w-5 h-5" /> Hire — Strong Candidate</>
                : <><XCircle className="w-5 h-5" /> No Hire — Keep Practicing</>}
            </div>
            <p className="text-slate-400 text-sm">
              Your interview has been analyzed by a FAANG-level AI evaluator.
              {report.hire_decision
                ? " You demonstrated strong technical and communication skills."
                : " Keep practicing the areas below to improve your score."}
            </p>
          </div>
        </div>
      </div>

      {/* Round Breakdown */}
      {report.round_breakdown?.length > 0 && (
        <div className="glass p-6 mb-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-400" /> Round Breakdown</h2>
          <div className="space-y-4">
            {report.round_breakdown.map((r) => {
              const pct = (r.average_score / 10) * 100;
              const barColor = r.average_score >= 7 ? "#4ade80" : r.average_score >= 5 ? "#fbbf24" : "#f87171";
              return (
                <div key={r.round_type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{r.round_type}</span>
                    <span style={{ color: barColor }}>{r.average_score.toFixed(1)}/10 · {r.questions_answered} Q&apos;s</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Strengths */}
        <div className="glass p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-emerald-300">
            <CheckCircle className="w-5 h-5" /> Strengths
          </h2>
          <ul className="space-y-3">
            {(report.strengths || []).map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-emerald-400 mt-0.5 shrink-0">✓</span> {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="glass p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-300">
            <AlertCircle className="w-5 h-5" /> Areas to Improve
          </h2>
          <ul className="space-y-3">
            {(report.weaknesses || []).map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-red-400 mt-0.5 shrink-0">✗</span> {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Roadmap */}
      {report.improvement_roadmap?.length > 0 && (
        <div className="glass p-6 mb-8">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" /> Improvement Roadmap
          </h2>
          <ol className="space-y-3">
            {report.improvement_roadmap.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs flex items-center justify-center shrink-0 font-bold">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/interview/setup" className="btn-primary flex-1 justify-center py-3">
          <TrendingUp className="w-4 h-4" /> Practice Again
        </Link>
        <Link href="/dashboard" className="btn-secondary flex-1 justify-center py-3">
          <BookOpen className="w-4 h-4" /> View All Reports
        </Link>
      </div>
    </div>
  );
}
