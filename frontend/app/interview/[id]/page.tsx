"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Brain, Send, Mic, MicOff, ChevronRight, Loader2, Terminal,
  CheckCircle2, AlertTriangle, Code2, StopCircle, Eye, EyeOff
} from "lucide-react";
import { getNextQuestion, submitAnswer, endSession, transcribeVoice } from "@/lib/api";
import { useInterviewStore, type Question, type Evaluation } from "@/lib/stores/interviewStore";

export default function InterviewPage() {
  const params = useParams();
  const router  = useRouter();
  const sessionId = Number(params.id);

  const {
    currentQuestion, history, answerDraft, isLoading, isComplete,
    plan, company, jobRole,
    setCurrentQuestion, setAnswerDraft, recordQA, setLoading, setComplete, latestScore,
  } = useInterviewStore();

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    if (!currentQuestion && !isComplete) fetchNext();
  }, []);

  const fetchNext = async () => {
    setLoading(true);
    setEvaluation(null);
    setShowHints(false);
    try {
      const q: Question = await getNextQuestion(sessionId, latestScore());
      setCurrentQuestion(q);
    } catch {
      await handleFinish();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentQuestion || !answerDraft.trim()) return;
    setLoading(true);
    try {
      const ev: Evaluation = await submitAnswer(currentQuestion.question_id, answerDraft);
      setEvaluation(ev);
      recordQA({ question: currentQuestion, answer: answerDraft, evaluation: ev });
    } catch {
      toast.error("Evaluation failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await endSession(sessionId);
      setComplete(true);
      router.push(`/report/${sessionId}`);
    } catch {
      toast.error("End session failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        try {
          const { transcription } = await transcribeVoice(blob);
          setAnswerDraft(transcription);
          toast.success("Voice transcribed.");
        } catch { toast.error("Transcription failed."); }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      toast.error("Microphone access denied.");
    }
  };

  const scoreColor = (s: number) =>
    s >= 7 ? "var(--nf-green)" : s >= 5 ? "var(--nf-amber)" : "var(--nf-magenta)";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--nf-void)" }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="nf-nav sticky top-0 z-40 px-5 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)" }}>
            <Brain className="w-3.5 h-3.5" style={{ color: "var(--nf-cyan)" }} />
          </div>
          <div>
            <span className="nf-heading" style={{ fontSize: "0.8rem", color: "var(--nf-text-1)" }}>{company}</span>
            <span className="nf-mono" style={{ fontSize: "0.7rem", color: "var(--nf-text-3)", marginLeft: "0.5rem" }}>· {jobRole}</span>
          </div>
        </div>

        {/* Round pills */}
        <div className="hidden md:flex items-center gap-2 ml-4">
          {plan.map((r) => {
            const answered = history.filter((h) => h.question.round_type === r.round).length;
            const done = answered >= r.num_questions;
            const active = currentQuestion?.round_type === r.round;
            return (
              <div key={r.round} className="flex items-center gap-1.5 nf-badge nf-mono"
                style={{
                  background: done ? "rgba(0,255,136,0.1)" : active ? "rgba(0,212,255,0.1)" : "rgba(15,31,61,0.6)",
                  borderColor: done ? "rgba(0,255,136,0.3)" : active ? "rgba(0,212,255,0.35)" : "var(--nf-border)",
                  color: done ? "var(--nf-green)" : active ? "var(--nf-cyan)" : "var(--nf-text-3)",
                  boxShadow: active ? "var(--glow-cyan)" : done ? "var(--glow-green)" : "none",
                  fontSize: "0.68rem",
                }}>
                <span className="nf-dot" style={{ width: 5, height: 5, background: done ? "var(--nf-green)" : active ? "var(--nf-cyan)" : "var(--nf-text-3)" }} />
                {r.round}
                {done && " ✓"}
              </div>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="nf-badge nf-badge-cyan nf-mono" style={{ fontSize: "0.65rem" }}>
            {history.length}/{plan.reduce((s, r) => s + r.num_questions, 0)} Q
          </span>
          <button onClick={handleFinish} className="nf-btn nf-btn-danger nf-btn-icon" title="End Session">
            <StopCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Progress bar ────────────────────────────────────────── */}
      <div className="nf-progress-track" style={{ borderRadius: 0, height: 2 }}>
        <div className="nf-progress-fill" style={{
          width: `${(history.length / Math.max(plan.reduce((s, r) => s + r.num_questions, 0), 1)) * 100}%`
        }} />
      </div>

      {/* ── Main Layout ─────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left: Question Panel */}
        <div style={{ width: "50%", padding: "1.5rem", overflowY: "auto", borderRight: "1px solid var(--nf-border)" }}>
          {isLoading && !currentQuestion ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1rem" }}>
              <div className="nf-animate-spin" style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid var(--nf-border)", borderTopColor: "var(--nf-cyan)", boxShadow: "var(--glow-cyan)" }} />
              <p className="nf-mono" style={{ fontSize: "0.78rem", color: "var(--nf-text-3)" }}>
                // generating next question...
              </p>
            </div>
          ) : currentQuestion ? (
            <div className="nf-animate-in nf-stagger">
              {/* Meta */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`nf-badge nf-mono nf-diff-${currentQuestion.difficulty}`}>
                  {currentQuestion.difficulty.toUpperCase()}
                </span>
                <span className="nf-badge nf-badge-violet nf-mono">{currentQuestion.round_type}</span>
                <span className="nf-mono ml-auto" style={{ fontSize: "0.65rem", color: "var(--nf-text-3)" }}>
                  Q{currentQuestion.question_number} · Round {currentQuestion.round_number}
                </span>
              </div>

              {/* Question card */}
              <div className="nf-card p-5 mb-4" style={{ borderLeft: "none" }}>
                <div className="flex items-start gap-2 mb-3">
                  <Terminal className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--nf-cyan)" }} />
                  <p className="nf-mono" style={{ fontSize: "0.65rem", color: "var(--nf-text-3)" }}>question.prompt</p>
                </div>
                <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "var(--nf-text-1)" }}>
                  {currentQuestion.question_text}
                </p>
              </div>

              {/* Hints */}
              {currentQuestion.hints.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="flex items-center gap-1.5 nf-mono"
                    style={{ fontSize: "0.72rem", color: "var(--nf-cyan)", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: showHints ? "0.75rem" : 0 }}
                  >
                    {showHints ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showHints ? "hide" : "show"} {currentQuestion.hints.length} hint(s)
                  </button>
                  {showHints && (
                    <div className="nf-card p-4" style={{ borderLeft: "none" }}>
                      {currentQuestion.hints.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
                          <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "var(--nf-violet)" }} />
                          <p className="nf-mono" style={{ fontSize: "0.78rem", color: "var(--nf-text-2)" }}>{h}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Evaluation */}
              {evaluation && (
                <div className="nf-card p-5 nf-animate-in" style={{
                  borderColor: evaluation.score >= 7 ? "rgba(0,255,136,0.3)" : evaluation.score >= 5 ? "rgba(255,171,0,0.3)" : "rgba(255,45,120,0.3)",
                  boxShadow: evaluation.score >= 7 ? "var(--glow-green)" : evaluation.score >= 5 ? "var(--glow-amber)" : "var(--glow-magenta)",
                  borderLeft: "none",
                }}>
                  <div className="flex items-center gap-3 mb-3">
                    {evaluation.score >= 7
                      ? <CheckCircle2 className="w-5 h-5" style={{ color: "var(--nf-green)" }} />
                      : <AlertTriangle className="w-5 h-5" style={{ color: "var(--nf-amber)" }} />}
                    <span className="nf-heading" style={{ fontSize: "1.25rem", color: scoreColor(evaluation.score) }}>
                      {evaluation.score}/10
                    </span>
                    <span className="nf-badge nf-mono" style={{
                      background: `rgba(${evaluation.score >= 7 ? "0,255,136" : evaluation.score >= 5 ? "255,171,0" : "255,45,120"},0.1)`,
                      color: scoreColor(evaluation.score),
                      border: `1px solid ${scoreColor(evaluation.score)}40`,
                      fontSize: "0.65rem",
                    }}>
                      {evaluation.score >= 7 ? "STRONG" : evaluation.score >= 5 ? "AVERAGE" : "NEEDS WORK"}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "var(--nf-text-2)", lineHeight: 1.6, marginBottom: "0.75rem" }}>
                    {evaluation.improvement}
                  </p>

                  {evaluation.follow_up_question && (
                    <div style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1rem" }}>
                      <p className="nf-mono" style={{ fontSize: "0.65rem", color: "var(--nf-text-3)", marginBottom: "0.35rem" }}>// follow_up</p>
                      <p style={{ fontSize: "0.85rem", color: "var(--nf-text-1)" }}>{evaluation.follow_up_question}</p>
                    </div>
                  )}

                  <div className="flex gap-3 mt-2">
                    <button onClick={fetchNext} className="nf-btn nf-btn-primary" style={{ flex: 1, justifyContent: "center", padding: "0.7rem" }}>
                      Next Question <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={handleFinish} className="nf-btn nf-btn-danger nf-btn-icon">
                      <StopCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Right: Answer Panel */}
        <div style={{ width: "50%", padding: "1.5rem", display: "flex", flexDirection: "column" }}>
          {/* Editor Header */}
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="w-4 h-4" style={{ color: "var(--nf-cyan)" }} />
            <span className="nf-mono" style={{ fontSize: "0.72rem", color: "var(--nf-text-3)" }}>candidate_answer.txt</span>

            {/* Voice button */}
            <button onClick={handleVoiceToggle} className="nf-btn nf-btn-ghost ml-auto" style={{ padding: "0.35rem 0.9rem", fontSize: "0.7rem", gap: "0.35rem" }}>
              {isRecording
                ? <><MicOff className="w-3.5 h-3.5" style={{ color: "var(--nf-magenta)" }} /><span style={{ color: "var(--nf-magenta)" }}>STOP REC</span></>
                : <><Mic className="w-3.5 h-3.5" /><span>VOICE</span></>}
            </button>
            {isRecording && <div className="nf-dot nf-dot-magenta animate-pulse" />}
          </div>

          {/* Code editor area */}
          <textarea
            value={answerDraft}
            onChange={(e) => setAnswerDraft(e.target.value)}
            placeholder={currentQuestion?.round_type === "DSA"
              ? "// Write your solution here\nfunction solve(input) {\n  \n}"
              : "// Type your answer..."}
            className="nf-code-editor"
            style={{ flex: 1, minHeight: 0 }}
          />

          {/* Submit */}
          <div className="mt-3">
            <button
              onClick={handleSubmit}
              disabled={!answerDraft.trim() || isLoading || !!evaluation}
              className="nf-btn nf-btn-primary w-full"
              style={{ justifyContent: "center", padding: "0.9rem", fontSize: "0.85rem" }}
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating...</>
                : <><Send className="w-4 h-4" /> Submit Answer</>}
            </button>
            <p className="nf-mono text-center mt-2" style={{ fontSize: "0.65rem", color: "var(--nf-text-3)" }}>
              // answers are evaluated by a FAANG-level AI rubric
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
