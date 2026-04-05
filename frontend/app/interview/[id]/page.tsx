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
    s >= 7 ? "var(--kz-moss)" : s >= 5 ? "var(--kz-gold)" : "var(--kz-coral)";

  return (
    <div className="min-h-screen flex flex-col relative z-10">

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="nf-nav sticky top-0 z-40 px-6 py-4 flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-[var(--kz-straw)] border border-[var(--kz-ink)]">
            <Brain className="w-4 h-4 text-[var(--kz-teal)]" />
          </div>
          <div>
            <span className="nf-heading text-sm text-[var(--kz-charcoal)]">{company}</span>
            <span className="nf-mono text-[10px] text-[var(--kz-text-3)] ml-2 uppercase tracking-widest">// {jobRole}</span>
          </div>
        </div>

        {/* Round pills */}
        <div className="hidden lg:flex items-center gap-3 ml-6">
          {plan.map((r) => {
            const answered = history.filter((h) => h.question.round_type === r.round).length;
            const done = answered >= r.num_questions;
            const active = currentQuestion?.round_type === r.round;
            return (
              <div key={r.round} className="flex items-center gap-2 nf-badge nf-mono text-[9px] border-[var(--kz-ink)]"
                style={{
                  background: done ? "rgba(74, 93, 78, 0.08)" : active ? "rgba(27, 79, 114, 0.08)" : "transparent",
                  color: done ? "var(--kz-moss)" : active ? "var(--kz-teal)" : "var(--kz-text-3)",
                }}>
                <div className="w-1.5 h-1.5" style={{ background: done ? "var(--kz-moss)" : active ? "var(--kz-teal)" : "var(--kz-text-3)" }} />
                {r.round.toUpperCase()}
                {done && " ✓"}
              </div>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-4">
          <span className="nf-badge nf-badge-cyan nf-mono text-[10px]">
            {history.length}/{plan.reduce((s, r) => s + r.num_questions, 0)} Q COMPLETE
          </span>
          <button onClick={handleFinish} className="nf-btn nf-btn-danger p-2" title="End Session">
            <StopCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Progress bar ────────────────────────────────────────── */}
      <div className="w-full h-[1px] bg-[var(--kz-ink)]">
        <div className="h-full bg-[var(--kz-teal)] transition-all duration-700" style={{
          width: `${(history.length / Math.max(plan.reduce((s, r) => s + r.num_questions, 0), 1)) * 100}%`
        }} />
      </div>

      {/* ── Main Layout ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Question Panel */}
        <div className="w-1/2 p-10 overflow-y-auto border-r border-[var(--kz-ink)] bg-white/20">
          {isLoading && !currentQuestion ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--kz-teal)]" />
              <p className="nf-mono text-[10px] uppercase tracking-[0.2em] text-[var(--kz-text-3)]">
                // Generating Next Question
              </p>
            </div>
          ) : currentQuestion ? (
            <div className="nf-animate-in nf-stagger">
              {/* Meta */}
              <div className="flex items-center gap-3 mb-8">
                <span className={`nf-badge nf-mono text-[9px] border-[var(--kz-ink)]`}>
                  {currentQuestion.difficulty.toUpperCase()}
                </span>
                <span className="nf-badge nf-badge-violet nf-mono text-[9px]">{currentQuestion.round_type.toUpperCase()}</span>
                <span className="nf-mono ml-auto text-[10px] text-[var(--kz-text-3)] tracking-tighter">
                  Q{currentQuestion.question_number} · ROUND {currentQuestion.round_number}
                </span>
              </div>

              {/* Question card */}
              <div className="nf-card p-8 mb-8 border-[var(--kz-ink)]">
                <div className="flex items-start gap-4 mb-6">
                  <Terminal className="w-4 h-4 text-[var(--kz-teal)] mt-1" />
                  <p className="nf-mono text-[10px] uppercase tracking-[0.2em] text-[var(--kz-text-3)]">Prompt</p>
                </div>
                <p className="text-xl md:text-2xl leading-relaxed text-[var(--kz-charcoal)] font-medium">
                  {currentQuestion.question_text}
                </p>
              </div>

              {/* Hints */}
              {currentQuestion.hints.length > 0 && (
                <div className="mb-8">
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="flex items-center gap-2 nf-mono text-[10px] text-[var(--kz-teal)] hover:opacity-70 transition-opacity mb-4"
                  >
                    {showHints ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showHints ? "HIDE" : "SHOW"} {currentQuestion.hints.length} GUIDANCE NOTES
                  </button>
                  {showHints && (
                    <div className="nf-card p-6 border-[var(--kz-ink)] bg-[var(--kz-straw)]/30">
                      {currentQuestion.hints.map((h, i) => (
                        <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                          <ChevronRight className="w-4 h-4 text-[var(--kz-teal)] mt-1" />
                          <p className="text-sm text-[var(--kz-text-2)] italic leading-relaxed">{h}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Evaluation */}
              {evaluation && (
                <div className="nf-card p-8 nf-animate-in border-[var(--kz-ink)] bg-white/40">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-[var(--kz-straw)] border border-[var(--kz-ink)]">
                      {evaluation.score >= 7
                        ? <CheckCircle2 className="w-6 h-6 text-[var(--kz-moss)]" />
                        : <AlertTriangle className="w-6 h-6 text-[var(--kz-gold)]" />}
                    </div>
                    <div>
                      <span className="nf-heading text-3xl mr-3" style={{ color: scoreColor(evaluation.score) }}>
                        {evaluation.score}/10
                      </span>
                      <span className="nf-badge nf-mono text-[9px]">
                        {evaluation.score >= 7 ? "STRONG PERFORMANCE" : evaluation.score >= 5 ? "AVERAGE RESPONSE" : "NEEDS REFINEMENT"}
                      </span>
                    </div>
                  </div>

                  <p className="text-base text-[var(--kz-text-1)] leading-relaxed mb-8">
                    {evaluation.improvement}
                  </p>

                  {evaluation.follow_up_question && (
                    <div className="bg-[var(--kz-straw)] border border-[var(--kz-ink)] p-6 mb-8">
                      <p className="nf-mono text-[9px] text-[var(--kz-text-3)] mb-2 uppercase tracking-widest">// Follow Up</p>
                      <p className="text-sm text-[var(--kz-charcoal)] font-medium leading-relaxed italic">
                        "{evaluation.follow_up_question}"
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button onClick={fetchNext} className="nf-btn nf-btn-primary flex-1 py-4">
                      Next Question <ChevronRight className="w-5 h-5" />
                    </button>
                    <button onClick={handleFinish} className="nf-btn nf-btn-danger px-6">
                      <StopCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Right: Answer Panel */}
        <div className="w-1/2 p-10 flex flex-col bg-white/10 backdrop-blur-sm">
          {/* Editor Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[var(--kz-straw)] border border-[var(--kz-ink)]">
              <Code2 className="w-4 h-4 text-[var(--kz-teal)]" />
            </div>
            <span className="nf-mono text-[10px] text-[var(--kz-text-3)] uppercase tracking-[0.2em]">Candidate Response</span>

            {/* Voice button */}
            <button onClick={handleVoiceToggle} 
              className={`nf-btn ml-auto py-2 px-6 text-[10px] ${isRecording ? 'bg-[var(--kz-coral)] text-white' : 'nf-btn-secondary'}`}>
              {isRecording
                ? <><MicOff className="w-4 h-4" /> STOP RECORDING</>
                : <><Mic className="w-4 h-4" /> VOICE MODE</>}
            </button>
          </div>

          {/* Answer area */}
          <textarea
            value={answerDraft}
            onChange={(e) => setAnswerDraft(e.target.value)}
            placeholder={currentQuestion?.round_type === "DSA"
              ? "// Write your solution here...\nfunction solve(input) {\n\n}"
              : "// Type your response here. Speak with clarity and confidence..."}
            className="nf-code-editor flex-1 p-8 text-lg border-[var(--kz-ink)] bg-transparent resize-none focus:bg-white/20 transition-colors"
          />

          {/* Submit */}
          <div className="mt-8">
            <button
              onClick={handleSubmit}
              disabled={!answerDraft.trim() || isLoading || !!evaluation}
              className="nf-btn nf-btn-primary w-full py-5 text-base"
            >
              {isLoading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> EVALUATING RESPONSE...</>
                : <><Send className="w-5 h-5" /> SUBMIT FOR REVIEW</>}
            </button>
            <p className="nf-mono text-center mt-4 text-[9px] text-[var(--kz-text-3)] tracking-[0.1em] uppercase">
              // Evaluation powered by FAANG-grade AI rubric
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
