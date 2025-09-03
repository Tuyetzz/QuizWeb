// /api/questions.ts
import { http } from "./http";
import type { Question } from "../types/question";

// Lấy tất cả questions
export async function getAllQuestions() {
  const res = await http.get<Question[]>("/questions");
  return res.data;
}

// Lấy chi tiết question theo id
export async function getQuestionById(id: number) {
  const res = await http.get<Question>(`/questions/${id}`);
  return res.data;
}

// Tạo mới question
export async function createQuestion(payload: Partial<Question>) {
  const res = await http.post<Question>("/questions", payload);
  return res.data;
}

// Cập nhật question
export async function updateQuestion(id: number, payload: Partial<Question>) {
  const res = await http.put<Question>(`/questions/${id}`, payload);
  return res.data;
}

// Xóa question
export async function deleteQuestion(id: number) {
  const res = await http.delete<{ success: boolean }>(`/questions/${id}`);
  return res.data;
}

// Tạo nhiều questions (batch)
export async function batchCreateQuestions(payload: Partial<Question>[]) {
  const res = await http.post<Question[]>("/questions/batch", payload);
  return res.data;
}
