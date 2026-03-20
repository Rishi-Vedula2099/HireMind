"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Brain, Upload, FileText, Loader2, ArrowRight, Building2, Briefcase, Mic } from "lucide-react";
import { uploadResume, setupInterview } from "@/lib/api";
import { useResumeStore } from "@/lib/stores/resumeStore";
import { useInterviewStore } from "@/lib/stores/interviewStore";

const COMPANIES = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix", "Stripe", "Spotify", "Startup"];
const ROLES = ["Software Engineer (SDE)", "Backend Engineer", "Frontend Engineer", "Full Stack Engineer", "ML Engineer", "Data Engineer", "DevOps/SRE"];

export default function InterviewSetupPage() {
  const router = useRouter();
  const { setResume, parsedData, resumeId, isUploading, setUploading, setError } = useResumeStore();
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
      toast.success(`Resume parsed! Found ${result.parsed_data?.skills?.length ?? 0} skills.`);
    } catch (e) {
      const msg = "Failed to upload resume. Try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }, [selectedRole, setResume, setUploading, setError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    maxFiles: 1,
  });

  const canStart = resumeId && selectedCompany && selectedRole;

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
      toast.error("Failed to create interview session.");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-12 max-w-3xl mx-auto" style={{ background: "var(--surface-1)" }}>
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-indigo-300 text-sm mb-5">
          <Brain className="w-4 h-4" /> Interview Setup
        </div>
        <h1 className="text-4xl font-bold mb-2">Set Up Your<span className="gradient-text"> AI Interview</span></h1>
        <p className="text-slate-400">3 steps to your personalized interview session.</p>
      </div>

      {/* Step 1: Resume */}
      <div className="glass p-6 mb-5">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 text-sm flex items-center justify-center font-bold">1</span>
          Upload Resume
        </h2>

        {parsedData ? (
          <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <FileText className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-300">Resume Parsed ✓</p>
              <p className="text-sm text-slate-400 mt-1">
                Skills: {parsedData.skills.slice(0, 5).join(", ")}
                {parsedData.skills.length > 5 && " ..."}
              </p>
              <p className="text-sm text-slate-400">Level: {parsedData.experience_level} · {parsedData.years_of_experience} yr(s) experience</p>
              <button onClick={() => useResumeStore.getState().clear()} className="text-xs text-indigo-400 mt-2 underline-offset-2 underline">
                Upload different resume
              </button>
            </div>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              isDragActive ? "border-indigo-400 bg-indigo-500/10" : "border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5"
            }`}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-slate-400">Analyzing your resume with AI...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-8 h-8 text-slate-500" />
                <p className="text-slate-300 font-medium">Drop your resume here or click to browse</p>
                <p className="text-slate-500 text-sm">PDF or DOCX · Max 5 MB</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Company */}
      <div className="glass p-6 mb-5">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 text-sm flex items-center justify-center font-bold">2</span>
          Select Company & Role
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 flex items-center gap-1.5"><Building2 className="w-4 h-4" />Target Company</label>
            <div className="flex flex-wrap gap-2">
              {COMPANIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCompany(c)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCompany === c
                      ? "bg-indigo-500 text-white"
                      : "glass text-slate-300 hover:border-indigo-500/50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 flex items-center gap-1.5"><Briefcase className="w-4 h-4" />Job Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full glass px-4 py-3 rounded-xl text-white bg-transparent border border-slate-700 focus:border-indigo-500 outline-none"
            >
              <option value="" style={{ background: "#1e293b" }}>Select a role...</option>
              {ROLES.map((r) => (
                <option key={r} value={r} style={{ background: "#1e293b" }}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Step 3: JD + voice */}
      <div className="glass p-6 mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 text-sm flex items-center justify-center font-bold">3</span>
          Paste Job Description (optional)
        </h2>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here to further personalize your interview..."
          rows={5}
          className="w-full glass px-4 py-3 rounded-xl text-slate-200 bg-transparent border border-slate-700 focus:border-indigo-500 outline-none resize-none text-sm"
        />

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setVoiceMode(!voiceMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              voiceMode ? "bg-indigo-500 text-white" : "glass text-slate-300"
            }`}
          >
            <Mic className="w-4 h-4" /> Voice Mode {voiceMode ? "ON" : "OFF"}
          </button>
          <span className="text-slate-500 text-xs">Speak your answers — transcribed by Whisper AI</span>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={!canStart || isStarting}
        className={`btn-primary w-full justify-center text-lg py-4 ${!canStart ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        {isStarting ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Creating your interview plan...</>
        ) : (
          <><Brain className="w-5 h-5" /> Start Interview <ArrowRight className="w-5 h-5" /></>
        )}
      </button>
    </div>
  );
}
