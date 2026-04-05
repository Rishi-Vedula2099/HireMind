"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Brain, Upload, FileText, Loader2, ArrowRight, Building2, Briefcase, Mic, Terminal, CheckCircle } from "lucide-react";
import { uploadResume, setupInterview } from "@/lib/api";
import { useResumeStore } from "@/lib/stores/resumeStore";
import { useInterviewStore } from "@/lib/stores/interviewStore";

const COMPANIES = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix", "Stripe", "Startup"];
const ROLES = [
  "Software Engineer (SDE)",
  "Backend Engineer",
  "Frontend Engineer",
  "Full Stack Engineer",
  "ML Engineer",
  "Data Engineer",
  "DevOps / SRE",
];

export default function InterviewSetupPage() {
  const router = useRouter();
  const { setResume, parsedData, resumeId, isUploading, setUploading, setError, clear } = useResumeStore();
  const { setSetupInfo, setSession } = useInterviewStore();

  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [voiceMode, setVoiceMode] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadResume(file, selectedRole || "Software Engineer");
      setResume(result.resume_id, file.name, result.parsed_data);
      toast.success(`Resume analyzed — ${result.parsed_data?.skills?.length ?? 0} skills detected.`);
    } catch {
      setError("Upload failed. Check file type and size.");
      toast.error("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }, [selectedRole, setResume, setUploading, setError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
  });

  const canStart = !!(resumeId && selectedCompany && selectedRole);

  const handleStart = async () => {
    if (!canStart) return;
    setIsStarting(true);
    try {
      setSetupInfo({ jobRole: selectedRole, company: selectedCompany, jobDescription, resumeId: resumeId!, voiceMode });
      const session = await setupInterview({
        resume_id: resumeId!,
        job_role: selectedRole,
        company: selectedCompany,
        job_description: jobDescription,
        voice_mode: voiceMode,
      });
      setSession(session.id, session.interview_plan);
      router.push(`/interview/${session.id}`);
    } catch {
      toast.error("Failed to create session. Try again.");
    } finally {
      setIsStarting(false);
    }
  };

  const stepDone = (n: number) => {
    if (n === 1) return !!parsedData;
    if (n === 2) return !!(selectedCompany && selectedRole);
    return false;
  };

  return (
    <div className="min-h-screen py-24 px-6 relative z-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-8 h-8 flex items-center justify-center bg-[var(--kz-straw)] border border-[var(--kz-ink)]">
            <Brain className="w-4 h-4 text-[var(--kz-teal)]" />
          </div>
          <span className="nf-heading text-base tracking-tight text-[var(--kz-charcoal)]">HIREMIND.ZEN</span>
          <span className="text-[var(--kz-ink)]">/</span>
          <span className="nf-mono text-[10px] uppercase tracking-widest text-[var(--kz-text-3)]">setup_interview()</span>
        </div>

        <h1 className="nf-heading text-4xl mb-2">
          Configure Your <span className="nf-gradient-text italic">Zen Interview</span>
        </h1>
        <p className="nf-mono text-[10px] uppercase tracking-[0.2em] text-[var(--kz-text-3)] mb-12">
          // Complete all 3 steps to initialize the engine
        </p>

        {/* ── Step 1: Resume ─────────────────────── */}
        <div className={`nf-card p-8 mb-6 border-[var(--kz-ink)] ${stepDone(1) ? 'bg-[var(--kz-moss)]/5 border-[var(--kz-moss)]/30' : ''}`}>
          <div className="flex items-center gap-4 mb-8">
            <span className={`nf-badge ${stepDone(1) ? "nf-badge-green" : "nf-badge-cyan"} nf-mono text-[10px]`}
              style={{ fontWeight: 700 }}>
              {stepDone(1) ? "✓" : "01"}
            </span>
            <h2 className="nf-heading text-lg">Knowledge Base: Resume</h2>
          </div>

          {parsedData ? (
            <div className="flex items-start gap-5 p-6 bg-[var(--kz-straw)] border border-[var(--kz-ink)]">
              <FileText className="w-6 h-6 shrink-0 mt-1 text-[var(--kz-moss)]" />
              <div className="flex-1">
                <p className="nf-heading text-base text-[var(--kz-moss)]">
                  Resume Indexed
                </p>
                <div className="mt-2 space-y-1">
                  <p className="nf-mono text-[10px] text-[var(--kz-text-2)] uppercase tracking-tight">
                    skills[{parsedData.skills.length}] = [{parsedData.skills.slice(0, 4).join(", ").toUpperCase()}{parsedData.skills.length > 4 ? ", ..." : ""}]
                  </p>
                  <p className="nf-mono text-[10px] text-[var(--kz-text-3)]">
                    LEVEL: {parsedData.experience_level.toUpperCase()} · EXP: {parsedData.years_of_experience} YRS
                  </p>
                </div>
                <button onClick={clear} className="nf-mono text-[10px] text-[var(--kz-teal)] uppercase tracking-widest mt-6 hover:underline">
                  Upload different file
                </button>
              </div>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-none p-12 text-center cursor-pointer transition-all ${isDragActive ? "border-[var(--kz-teal)] bg-[var(--kz-teal)]/5" : "border-[var(--kz-ink)]"}`}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-[var(--kz-teal)]" />
                  <p className="nf-mono text-[10px] uppercase tracking-[0.2em] text-[var(--kz-teal)]">
                    // Parsing Knowledge with AI
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-5">
                  <div className="w-16 h-16 flex items-center justify-center bg-[var(--kz-straw)] border border-[var(--kz-ink)]">
                    <Upload className="w-6 h-6 text-[var(--kz-text-3)]" />
                  </div>
                  <div>
                    <p className="nf-heading text-base mb-1">
                      Drag resume here or click to browse
                    </p>
                    <p className="nf-mono text-[10px] text-[var(--kz-text-3)] uppercase tracking-widest">PDF · DOCX · Max 5 MB</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Step 2: Company + Role ─────────────── */}
        <div className={`nf-card p-8 mb-6 border-[var(--kz-ink)] ${stepDone(2) ? 'bg-[var(--kz-moss)]/5 border-[var(--kz-moss)]/30' : ''}`}>
          <div className="flex items-center gap-4 mb-8">
            <span className={`nf-badge ${stepDone(2) ? "nf-badge-green" : "nf-badge-violet"} nf-mono text-[10px]`} style={{ fontWeight: 700 }}>
              {stepDone(2) ? "✓" : "02"}
            </span>
            <h2 className="nf-heading text-lg">Target: Company & Role</h2>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-[var(--kz-text-3)]" />
              <span className="nf-mono text-[10px] uppercase tracking-[0.2em] text-[var(--kz-text-3)]">// Select Company</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-8">
              {COMPANIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCompany(c)}
                  className={`px-4 py-2 nf-mono text-[10px] border transition-all ${selectedCompany === c ? "bg-[var(--kz-teal)] text-white border-[var(--kz-teal)]" : "bg-[var(--kz-straw)] border-[var(--kz-ink)] text-[var(--kz-text-2)] hover:border-[var(--kz-text-2)]"}`}
                >
                  {c.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-4 h-4 text-[var(--kz-text-3)]" />
              <span className="nf-mono text-[10px] uppercase tracking-[0.2em] text-[var(--kz-text-3)]">// Select Role</span>
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="nf-input py-4 text-xs font-semibold uppercase tracking-wider bg-[var(--kz-straw)]/50"
            >
              <option value="">— SELECT TARGET ROLE —</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Step 3: JD + voice ────────────────── */}
        <div className="nf-card p-8 mb-12 border-[var(--kz-ink)]">
          <div className="flex items-center gap-4 mb-8">
            <span className="nf-badge nf-badge-cyan nf-mono text-[10px]" style={{ fontWeight: 700 }}>03</span>
            <h2 className="nf-heading text-lg">Context: Job Description</h2>
            <span className="nf-badge text-[9px] ml-auto border-[var(--kz-ink)] text-[var(--kz-text-3)]">OPTIONAL</span>
          </div>

          <span className="nf-mono text-[10px] uppercase tracking-[0.2em] text-[var(--kz-text-3)] mb-4 block">
            // Paste job details for deep personalization
          </span>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="// Paste text here..."
            rows={4}
            className="nf-input p-6 text-sm bg-[var(--kz-straw)]/30 min-h-[160px]"
          />

          {/* Voice toggle */}
          <div className="flex items-center gap-4 mt-8 pt-8 border-t border-[var(--kz-ink)]">
            <button
              onClick={() => setVoiceMode(!voiceMode)}
              className={`w-12 h-6 flex items-center px-1 transition-colors ${voiceMode ? "bg-[var(--kz-teal)]" : "bg-[var(--kz-ink)]"}`}
              role="switch"
              aria-checked={voiceMode}
            >
              <div className={`w-4 h-4 bg-white transition-transform ${voiceMode ? "translate-x-6" : "translate-x-0"}`} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Mic className={`w-4 h-4 ${voiceMode ? "text-[var(--kz-teal)]" : "text-[var(--kz-text-3)]"}`} />
                <span className={`nf-mono text-[10px] uppercase tracking-widest ${voiceMode ? "text-[var(--kz-teal)]" : "text-[var(--kz-text-2)]"}`}>
                  VOICE_MODE = {voiceMode ? "TRUE" : "FALSE"}
                </span>
              </div>
              <p className="nf-mono text-[9px] text-[var(--kz-text-3)] uppercase mt-1 tracking-tighter">
                Answers transcribed by Whisper AI
              </p>
            </div>
          </div>
        </div>

        {/* ── Launch Button ──────────────────────── */}
        <button
          onClick={handleStart}
          disabled={!canStart || isStarting}
          className="nf-btn nf-btn-primary w-full py-6 text-base"
        >
          {isStarting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> INITIALIZING SESSION...</>
          ) : (
            <><Terminal className="w-5 h-5" /> START ZEN INTERVIEW <ArrowRight className="w-5 h-5" /></>
          )}
        </button>

        {!canStart && (
          <p className="nf-mono text-center mt-5 text-[9px] text-[var(--kz-text-3)] uppercase tracking-[0.2em]">
            // Complete steps 01 + 02 to reveal engine
          </p>
        )}
      </div>
    </div>
  );
}
