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
