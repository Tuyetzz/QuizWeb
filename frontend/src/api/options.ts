// /api/options.ts
import { http } from "./http";
import type { Option } from "../types/options";

// Lấy danh sách options của 1 question
export async function getOptionsByQuestion(questionId: number) {
  const res = await http.get<Option[]>(`/options/question/${questionId}`);
  return res.data;
}

// Lấy chi tiết 1 option theo id
export async function getOptionById(id: number) {
  const res = await http.get<Option>(`/options/${id}`);
  return res.data;
}

// Tạo option mới cho 1 question
export async function createOption(questionId: number, payload: Partial<Option>) {
  const res = await http.post<Option>(`/options/question/${questionId}`, payload);
  return res.data;
}

// Cập nhật option
export async function updateOption(id: number, payload: Partial<Option>) {
  const res = await http.put<Option>(`/options/${id}`, payload);
  return res.data;
}

// Xóa option
export async function deleteOption(id: number) {
  const res = await http.delete<{ success: boolean }>(`/options/${id}`);
  return res.data;
}
