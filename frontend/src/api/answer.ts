// /api/answer.ts
import { http } from "./http";
import type { Answer } from "../types/answer";

// Lấy danh sách answers theo attemptId
export async function getAnswersByAttempt(attemptId: number) {
  const res = await http.get<Answer[]>(`/answers/attempt/${attemptId}`);
  return res.data;
}

// Lấy chi tiết 1 answer theo id
export async function getAnswerById(id: number) {
  const res = await http.get<Answer>(`/answers/${id}`);
  return res.data;
}

// Tạo answer mới cho 1 câu hỏi trong attempt
export async function createAnswer(
  attemptId: number,
  questionId: number,
  payload: Partial<Answer>
) {
  const res = await http.post<Answer>(
    `/answers/${attemptId}/question/${questionId}`,
    payload
  );
  return res.data;
}

// Cập nhật answer
export async function updateAnswer(id: number, payload: Partial<Answer>) {
  const res = await http.put<Answer>(`/answers/${id}`, payload);
  return res.data;
}

// Xóa answer
export async function deleteAnswer(id: number) {
  const res = await http.delete<{ success: boolean }>(`/answers/${id}`);
  return res.data;
}

// Submit nhiều answers 1 lần
export async function submitAnswers(payload: Answer[]) {
  const res = await http.post<{ success: boolean; results: Answer[] }>(
    "/answers/submit",
    payload
  );
  return res.data;
}
