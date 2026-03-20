// HireMind — Zustand Interview Store
// Manages the entire interview session state on the client side

import { create } from "zustand";

export type RoundType = "DSA" | "System Design" | "Behavioral";
export type Difficulty = "easy" | "medium" | "hard";

export interface InterviewRoundPlan {
  round: RoundType;
  difficulty: Difficulty;
  focus_topics: string[];
  num_questions: number;
}

export interface Question {
  question_id: number;
  question_text: string;
  round_type: RoundType;
  difficulty: Difficulty;
  hints: string[];
  round_number: number;
  question_number: number;
}

export interface Evaluation {
  score: number;
  correctness: string;
  depth: string;
  communication: string;
  real_world: string;
  strengths: string[];
  weaknesses: string[];
  improvement: string;
  follow_up_question: string;
  concept_match: string[];
  missing_concepts: string[];
}

export interface QAPair {
  question: Question;
  answer: string;
  evaluation: Evaluation | null;
}

interface InterviewState {
  // Session info
  sessionId: number | null;
  jobRole: string;
  company: string;
  jobDescription: string;
  resumeId: number | null;
  voiceMode: boolean;

  // Interview progress
  plan: InterviewRoundPlan[];
  currentQuestion: Question | null;
  history: QAPair[];
  isLoading: boolean;
  isComplete: boolean;

  // Current answer draft
  answerDraft: string;

  // Actions
  setSession: (id: number, plan: InterviewRoundPlan[]) => void;
  setSetupInfo: (info: {
    jobRole: string;
    company: string;
    jobDescription: string;
    resumeId: number;
    voiceMode?: boolean;
  }) => void;
  setCurrentQuestion: (q: Question) => void;
  setAnswerDraft: (text: string) => void;
  recordQA: (qa: QAPair) => void;
  setLoading: (loading: boolean) => void;
  setComplete: (v: boolean) => void;
  reset: () => void;

  // Computed
  latestScore: () => number | null;
  currentRoundIndex: () => number;
}

const initialState = {
  sessionId: null,
  jobRole: "",
  company: "",
  jobDescription: "",
  resumeId: null,
  voiceMode: false,
  plan: [],
  currentQuestion: null,
  history: [],
  isLoading: false,
  isComplete: false,
  answerDraft: "",
};

export const useInterviewStore = create<InterviewState>((set, get) => ({
  ...initialState,

  setSession: (id, plan) => set({ sessionId: id, plan }),

  setSetupInfo: (info) =>
    set({
      jobRole: info.jobRole,
      company: info.company,
      jobDescription: info.jobDescription,
      resumeId: info.resumeId,
      voiceMode: info.voiceMode ?? false,
    }),

  setCurrentQuestion: (q) => set({ currentQuestion: q }),

  setAnswerDraft: (text) => set({ answerDraft: text }),

  recordQA: (qa) =>
    set((state) => ({
      history: [...state.history, qa],
      answerDraft: "",
      currentQuestion: null,
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setComplete: (v) => set({ isComplete: v }),

  reset: () => set(initialState),

  latestScore: () => {
    const history = get().history;
    if (!history.length) return null;
    const last = history[history.length - 1];
    return last.evaluation?.score ?? null;
  },

  currentRoundIndex: () => {
    const q = get().currentQuestion;
    if (!q) return 0;
    return q.round_number - 1;
  },
}));
