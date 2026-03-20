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
    <div style={{ minHeight: "100vh", background: "var(--nf-void)", padding: "5rem 1.5rem 3rem" }}>
      {/* Back nav */}
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div className="flex items-center gap-2 mb-8">
          <Brain className="w-5 h-5" style={{ color: "var(--nf-cyan)" }} />
          <span className="nf-heading" style={{ color: "var(--nf-cyan)" }}>HIREMIND.AI</span>
          <span style={{ color: "var(--nf-border)" }}>/</span>
          <span className="nf-mono" style={{ fontSize: "0.78rem", color: "var(--nf-text-3)" }}>setup_interview()</span>
        </div>

        <h1 className="nf-heading" style={{ fontSize: "2.2rem", marginBottom: "0.4rem" }}>
          Configure Your <span className="nf-gradient-text">Neural Interview</span>
        </h1>
        <p className="nf-mono" style={{ fontSize: "0.78rem", color: "var(--nf-text-3)", marginBottom: "2.5rem" }}>
          // Complete all 3 steps to initialize the interview engine
        </p>

        {/* ── Step 1: Resume ─────────────────────── */}
        <div className="nf-card p-6 mb-5" style={stepDone(1) ? { borderColor: "rgba(0,255,136,0.3)", boxShadow: "var(--glow-green)" } : {}}>
          <div className="flex items-center gap-3 mb-5">
            <span className={`nf-badge ${stepDone(1) ? "nf-badge-green" : "nf-badge-cyan"} nf-mono`}
              style={{ fontWeight: 700 }}>
              {stepDone(1) ? "✓" : "01"}
            </span>
            <h2 className="nf-heading" style={{ fontSize: "1rem" }}>Upload Resume</h2>
          </div>

          {parsedData ? (
            <div className="flex items-start gap-4 p-4 rounded-lg" style={{ background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.2)" }}>
              <FileText className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--nf-green)" }} />
              <div className="flex-1">
                <p className="nf-heading" style={{ fontSize: "0.9rem", color: "var(--nf-green)" }}>
                  <CheckCircle className="w-3.5 h-3.5 inline mr-1.5" />Resume Indexed
                </p>
                <p className="nf-mono" style={{ fontSize: "0.72rem", color: "var(--nf-text-2)", marginTop: "0.35rem" }}>
                  skills[{parsedData.skills.length}] = [{parsedData.skills.slice(0, 4).join(", ")}{parsedData.skills.length > 4 ? ", ..." : ""}]
                </p>
                <p className="nf-mono" style={{ fontSize: "0.72rem", color: "var(--nf-text-3)" }}>
                  level: {parsedData.experience_level} · yrs: {parsedData.years_of_experience}
                </p>
                <button onClick={clear} className="nf-mono" style={{ fontSize: "0.7rem", color: "var(--nf-cyan)", marginTop: "0.5rem", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Upload different file
                </button>
              </div>
            </div>
          ) : (
            <div
              {...getRootProps()}
              style={{
                border: `2px dashed ${isDragActive ? "var(--nf-cyan)" : "var(--nf-border)"}`,
                borderRadius: 10,
                padding: "3rem 2rem",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                background: isDragActive ? "rgba(0,212,255,0.04)" : "transparent",
              }}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--nf-cyan)" }} />
                  <p className="nf-mono" style={{ fontSize: "0.8rem", color: "var(--nf-cyan)" }}>
                    // Parsing resume with AI...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)" }}>
                    <Upload className="w-6 h-6" style={{ color: "var(--nf-text-3)" }} />
                  </div>
                  <div>
                    <p className="nf-heading" style={{ fontSize: "0.95rem", marginBottom: "0.25rem" }}>
                      Drop resume here or click to browse
                    </p>
                    <p className="nf-mono" style={{ fontSize: "0.72rem", color: "var(--nf-text-3)" }}>PDF · DOCX · Max 5 MB</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Step 2: Company + Role ─────────────── */}
        <div className="nf-card p-6 mb-5" style={stepDone(2) ? { borderColor: "rgba(0,255,136,0.3)", boxShadow: "var(--glow-green)" } : {}}>
          <div className="flex items-center gap-3 mb-5">
            <span className={`nf-badge ${stepDone(2) ? "nf-badge-green" : "nf-badge-violet"} nf-mono`} style={{ fontWeight: 700 }}>
              {stepDone(2) ? "✓" : "02"}
            </span>
            <h2 className="nf-heading" style={{ fontSize: "1rem" }}>Target Company & Role</h2>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Building2 className="w-3.5 h-3.5" style={{ color: "var(--nf-violet)" }} />
              <span className="nf-mono" style={{ fontSize: "0.72rem", color: "var(--nf-text-3)" }}>// select company</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              {COMPANIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCompany(c)}
                  className={`nf-tag ${selectedCompany === c ? "active" : ""}`}
                >
                  {selectedCompany === c && <span className="nf-dot nf-dot-cyan" style={{ width: 5, height: 5 }} />}
                  {c}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 mb-3">
              <Briefcase className="w-3.5 h-3.5" style={{ color: "var(--nf-violet)" }} />
              <span className="nf-mono" style={{ fontSize: "0.72rem", color: "var(--nf-text-3)" }}>// select role</span>
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="nf-input nf-select nf-mono"
              style={{ fontSize: "0.85rem" }}
            >
              <option value="" style={{ background: "var(--nf-abyss)" }}>— select role —</option>
              {ROLES.map((r) => (
                <option key={r} value={r} style={{ background: "var(--nf-abyss)" }}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Step 3: JD + voice ────────────────── */}
        <div className="nf-card p-6 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <span className="nf-badge nf-badge-amber nf-mono" style={{ fontWeight: 700 }}>03</span>
            <h2 className="nf-heading" style={{ fontSize: "1rem" }}>Job Description + Options</h2>
            <span className="nf-badge" style={{ fontSize: "0.62rem", marginLeft: "auto", background: "rgba(255,171,0,0.08)", color: "var(--nf-amber)", border: "1px solid rgba(255,171,0,0.2)" }}>OPTIONAL</span>
          </div>

          <span className="nf-mono" style={{ fontSize: "0.72rem", color: "var(--nf-text-3)", display: "block", marginBottom: "0.5rem" }}>
            // paste job description for deeper personalization
          </span>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="// Paste job description here..."
            rows={4}
            className="nf-input nf-textarea"
          />

          {/* Voice toggle */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setVoiceMode(!voiceMode)}
              className={`nf-toggle ${voiceMode ? "on" : ""}`}
              role="switch"
              aria-checked={voiceMode}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" style={{ color: voiceMode ? "var(--nf-cyan)" : "var(--nf-text-3)" }} />
                <span className="nf-mono" style={{ fontSize: "0.78rem", color: voiceMode ? "var(--nf-cyan)" : "var(--nf-text-2)" }}>
                  voice_mode = {voiceMode ? "true" : "false"}
                </span>
              </div>
              <p className="nf-mono" style={{ fontSize: "0.68rem", color: "var(--nf-text-3)", marginTop: "0.15rem" }}>
                Speak answers — transcribed by Whisper AI
              </p>
            </div>
          </div>
        </div>

        {/* ── Launch Button ──────────────────────── */}
        <button
          onClick={handleStart}
          disabled={!canStart || isStarting}
          className="nf-btn nf-btn-primary w-full"
          style={{ justifyContent: "center", fontSize: "0.95rem", padding: "1rem 2rem" }}
        >
          {isStarting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Initializing neural session...</>
          ) : (
            <><Terminal className="w-5 h-5" /> Launch Interview Engine <ArrowRight className="w-5 h-5" /></>
          )}
        </button>

        {!canStart && (
          <p className="nf-mono text-center mt-3" style={{ fontSize: "0.7rem", color: "var(--nf-text-3)" }}>
            // Complete steps 01 + 02 to unlock launch
          </p>
        )}
      </div>
    </div>
  );
}
