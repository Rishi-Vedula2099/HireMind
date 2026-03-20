// HireMind — API Service Layer
// Typed wrappers for all backend API endpoints

import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Inject Clerk JWT token on every request
api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    // Clerk v5 — get token from window.__clerk_db_jwt or useAuth() hook
    const Clerk = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } }).Clerk;
    const token = await Clerk?.session?.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});


// ── Auth ─────────────────────────────────────────────────────────────

export const syncUser = async (payload: {
  clerk_id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}) => api.post("/api/auth/sync", payload).then((r) => r.data);

export const getMe = async () => api.get("/api/auth/me").then((r) => r.data);


// ── Resume ────────────────────────────────────────────────────────────

export const uploadResume = async (file: File, jobRole: string) => {
  const form = new FormData();
  form.append("file", file);
  return api
    .post(`/api/resume/upload?job_role=${encodeURIComponent(jobRole)}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const listResumes = async () =>
  api.get("/api/resume/").then((r) => r.data);

export const deleteResume = async (id: number) =>
  api.delete(`/api/resume/${id}`).then((r) => r.data);


// ── Interview ─────────────────────────────────────────────────────────

export const setupInterview = async (payload: {
  resume_id: number;
  job_role: string;
  company: string;
  job_description?: string;
  voice_mode?: boolean;
}) => api.post("/api/interview/setup", payload).then((r) => r.data);

export const getNextQuestion = async (
  session_id: number,
  previous_score?: number | null
) =>
  api
    .post("/api/interview/next", { session_id, previous_score })
    .then((r) => r.data);

export const submitAnswer = async (question_id: number, answer_text: string) =>
  api
    .post("/api/interview/answer", { question_id, answer_text })
    .then((r) => r.data);

export const getSession = async (session_id: number) =>
  api.get(`/api/interview/${session_id}`).then((r) => r.data);

export const endSession = async (session_id: number) =>
  api.post(`/api/interview/${session_id}/end`).then((r) => r.data);

export const transcribeVoice = async (blob: Blob) => {
  const form = new FormData();
  form.append("audio", blob, "voice.webm");
  return api
    .post("/api/interview/voice", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};


// ── Reports ───────────────────────────────────────────────────────────

export const getReport = async (session_id: number) =>
  api.get(`/api/report/${session_id}`).then((r) => r.data);

export const listReports = async () =>
  api.get("/api/report/history").then((r) => r.data);


// ── Payments ─────────────────────────────────────────────────────────

export const createCheckout = async (payload: {
  price_id: string;
  success_url: string;
  cancel_url: string;
}) => api.post("/api/payments/checkout", payload).then((r) => r.data);

export const getBillingPortal = async (return_url: string) =>
  api.get(`/api/payments/portal?return_url=${encodeURIComponent(return_url)}`).then((r) => r.data);

export default api;
