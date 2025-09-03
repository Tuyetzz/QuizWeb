// /api/attemptsquestions.ts
import { http } from "./http";
import type { AttemptQuestion } from "../types/attemptsquestion";

// Lấy danh sách AttemptQuestions theo attemptId
export async function getAttemptQuestions(attemptId: number) {
  const res = await http.get<AttemptQuestion[]>(`/attempt-questions/attempt/${attemptId}`);
  return res.data;
}

// Thêm 1 AttemptQuestions
export async function addAttemptQuestion(payload: Partial<AttemptQuestion>) {
  const res = await http.post<AttemptQuestion>("/attempt-questions", payload);
  return res.data;
}

// Cập nhật 1 AttemptQuestion
export async function updateAttemptQuestion(id: number, payload: Partial<AttemptQuestion>) {
  const res = await http.put<AttemptQuestion>(`/attempt-questions/${id}`, payload);
  return res.data;
}

// Xóa 1 AttemptQuestion
export async function deleteAttemptQuestion(id: number) {
  const res = await http.delete<{ success: boolean }>(`/attempt-questions/${id}`);
  return res.data;
}
