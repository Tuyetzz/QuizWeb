import { http } from "./http";
import type {
  Attempt,
  CreateAttemptPayload,
  CreateAttemptResponse,
  StartExamPayload,
  StartPracticePayload,
  ExamStartResponse,
  PracticeStartResponse,
} from "../types/attempt";

// (giữ nguyên nếu bạn còn dùng cho CRUD thủ công)
export async function createAttempt(payload: CreateAttemptPayload): Promise<CreateAttemptResponse> {
  const res = await http.post("/attempts", payload);
  return res.data;
}

export async function getAttempt(attemptId: number): Promise<Attempt> {
  const res = await http.get(`/attempts/${attemptId}`);
  return res.data;
}

// ---- Start EXAM (thi) ----
export async function startExam(payload: StartExamPayload): Promise<ExamStartResponse> {
  const res = await http.post<ExamStartResponse>("/attempts/start", payload);
  return res.data;
}

// ---- Start PRACTICE (luyện tập theo range) ----
export async function startPractice(payload: StartPracticePayload): Promise<PracticeStartResponse> {
  const res = await http.post<PracticeStartResponse>("/attempts/practice", payload);
  return res.data;
}

// ---- Cập nhật attempt (metadata, chuyển state nhẹ) ----
// KHÔNG dùng để chấm điểm / submit
export async function updateAttempt(
  attemptId: number,
  patch: Partial<Pick<Attempt, "status" | "settings" | "expiresAt" | "startedAt">>
): Promise<Attempt> {
  const res = await http.patch<Attempt>(`/attempts/${attemptId}`, patch);
  return res.data;
}

// Kiểu dữ liệu server trả về khi submit (phù hợp GradingService)
export type SubmitAttemptResult = {
  attemptId: number;
  status: "submitted" | "graded" | "expired" | "in_progress" | "draft";
  score: number;
  maxScore: number;
  submittedAt?: string; // hoặc Date tùy backend serialize
};

// ---- Nộp bài (gọi grading service) ----
export async function submitAttempt(attemptId: number): Promise<SubmitAttemptResult> {
  const res = await http.post<SubmitAttemptResult>(`/attempts/${attemptId}/submit`);
  return res.data;
}
