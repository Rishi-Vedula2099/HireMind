"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Brain, Send, Mic, MicOff, ChevronRight, Loader2,
  CheckCircle2, AlertCircle, Code2, StopCircle
} from "lucide-react";
import { getNextQuestion, submitAnswer, endSession, transcribeVoice } from "@/lib/api";
import { useInterviewStore, type Question, type Evaluation } from "@/lib/stores/interviewStore";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
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

  // Load first question on mount
  useEffect(() => {
    if (!currentQuestion && !isComplete) {
      fetchNext();
    }
  }, []);

  const fetchNext = async () => {
    setLoading(true);
    setEvaluation(null);
    setShowHints(false);
    try {
      const q: Question = await getNextQuestion(sessionId, latestScore());
      setCurrentQuestion(q);
    } catch {
      // No more questions
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
      toast.error("Failed to evaluate answer.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const result = await endSession(sessionId);
      setComplete(true);
      router.push(`/report/${sessionId}`);
    } catch {
      toast.error("Failed to end session.");
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
          toast.success("Voice transcribed!");
        } catch {
          toast.error("Transcription failed.");
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      toast.error("Microphone access denied.");
    }
  };

  const roundProgress = plan.map((p, i) => ({
    ...p,
    done: history.filter((h) => h.question.round_type === p.round).length >= p.num_questions,
    active: currentQuestion?.round_type === p.round,
  }));

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--surface-1)" }}>
      {/* ── Header ─────────────────────────────────────── */}
      <header className="glass border-b border-indigo-500/10 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-indigo-400" />
          <div>
            <span className="font-bold text-sm">{company}</span>
            <span className="text-slate-500 text-sm"> · {jobRole}</span>
          </div>
        </div>

        {/* Round progress pills */}
        <div className="hidden md:flex items-center gap-2">
          {roundProgress.map((r) => (
            <span
              key={r.round}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                r.done ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                : r.active ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse-brand"
                : "glass text-slate-500"
              }`}
            >
              {r.done ? "✓ " : ""}{r.round}
            </span>
          ))}
        </div>

        <span className="glass px-3 py-1.5 rounded-full text-xs text-slate-400">
          {history.length} answered
        </span>
      </header>

      {/* ── Main Split Layout ───────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Question Panel */}
        <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r border-slate-800">
          {isLoading && !currentQuestion ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p>Generating your next question...</p>
            </div>
          ) : currentQuestion ? (
            <>
              {/* Round + Difficulty badges */}
              <div className="flex items-center gap-2 mb-5">
                <span className="badge glass text-indigo-300 border-indigo-500/20">
                  {currentQuestion.round_type}
                </span>
                <span className={`badge badge-${currentQuestion.difficulty}`}>
                  {currentQuestion.difficulty}
                </span>
                <span className="text-slate-500 text-xs ml-auto">
                  Q{currentQuestion.question_number} · Round {currentQuestion.round_number}
                </span>
              </div>

              {/* Question */}
              <div className="glass p-5 mb-5">
                <p className="text-lg leading-relaxed">{currentQuestion.question_text}</p>
              </div>

              {/* Hints */}
              {currentQuestion.hints.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="text-xs text-indigo-400 underline underline-offset-2 mb-3"
                  >
                    {showHints ? "Hide hints" : `Show ${currentQuestion.hints.length} hint(s)`}
                  </button>
                  {showHints && (
                    <ul className="space-y-2">
                      {currentQuestion.hints.map((h, i) => (
                        <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" /> {h}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Evaluation result */}
              {evaluation && (
                <div className={`mt-6 rounded-xl p-5 border ${evaluation.score >= 7 ? "bg-emerald-500/10 border-emerald-500/20" : evaluation.score >= 5 ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    {evaluation.score >= 7 ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-amber-400" />}
                    <span className="font-bold text-lg">{evaluation.score}/10</span>
                    <span className={`badge ${evaluation.score >= 7 ? "badge-easy" : evaluation.score >= 5 ? "badge-medium" : "badge-hard"}`}>
                      {evaluation.score >= 7 ? "Strong" : evaluation.score >= 5 ? "Average" : "Needs Work"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">{evaluation.improvement}</p>
                  {evaluation.follow_up_question && (
                    <div className="glass p-3 rounded-lg mt-3">
                      <p className="text-xs text-slate-400 mb-1">Follow-up</p>
                      <p className="text-sm text-slate-200">{evaluation.follow_up_question}</p>
                    </div>
                  )}

                  <div className="flex gap-3 mt-5">
                    <button onClick={fetchNext} className="btn-primary flex-1 justify-center py-3">
                      Next Question <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={handleFinish} className="btn-secondary py-3 px-4">
                      <StopCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Right: Answer Panel */}
        <div className="hidden md:flex w-1/2 flex-col p-6">
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold">Your Answer</span>
            <button
              onClick={handleVoiceToggle}
              className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isRecording ? "bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse-brand" : "glass text-slate-400"
              }`}
            >
              {isRecording ? <><MicOff className="w-3 h-3" /> Stop Recording</> : <><Mic className="w-3 h-3" /> Voice Input</>}
            </button>
          </div>

          <textarea
            value={answerDraft}
            onChange={(e) => setAnswerDraft(e.target.value)}
            placeholder={
              currentQuestion?.round_type === "DSA"
                ? "// Write your solution here...\nfunction solve(input) {\n  \n}"
                : "Type your answer here..."
            }
            className="flex-1 glass px-4 py-4 rounded-xl text-slate-200 bg-transparent border border-slate-700 focus:border-indigo-500 outline-none resize-none font-mono text-sm"
          />

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!answerDraft.trim() || isLoading || !!evaluation}
              className={`btn-primary flex-1 justify-center py-3 ${(!answerDraft.trim() || isLoading || !!evaluation) ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating...</> : <><Send className="w-4 h-4" /> Submit Answer</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
