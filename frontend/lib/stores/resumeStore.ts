// HireMind — Zustand Resume Store
// Manages parsed resume data and upload state

import { create } from "zustand";

export interface ParsedResume {
  skills: string[];
  experience_level: "junior" | "mid" | "senior";
  years_of_experience: number;
  project_domains: string[];
  education: string[];
  certifications: string[];
  weak_areas: string[];
  strengths: string[];
  suggested_roles: string[];
}

interface ResumeState {
  resumeId: number | null;
  filename: string | null;
  parsedData: ParsedResume | null;
  isUploading: boolean;
  uploadError: string | null;

  setResume: (id: number, filename: string, data: ParsedResume) => void;
  setUploading: (v: boolean) => void;
  setError: (err: string | null) => void;
  clear: () => void;
}

export const useResumeStore = create<ResumeState>((set) => ({
  resumeId: null,
  filename: null,
  parsedData: null,
  isUploading: false,
  uploadError: null,

  setResume: (id, filename, data) =>
    set({ resumeId: id, filename, parsedData: data, uploadError: null }),

  setUploading: (v) => set({ isUploading: v }),

  setError: (err) => set({ uploadError: err }),

  clear: () =>
    set({
      resumeId: null,
      filename: null,
      parsedData: null,
      isUploading: false,
      uploadError: null,
    }),
}));
