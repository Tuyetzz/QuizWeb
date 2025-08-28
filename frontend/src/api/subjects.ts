import { http } from "./http";
import type { Subject } from "../types/subject";

// Lấy toàn bộ subjects
export async function getSubjects(): Promise<Subject[]> {
  const res = await http.get("/subjects");
  return res.data;
}

// Lấy 1 subject theo id
export async function getSubjectById(id: number): Promise<Subject> {
  const res = await http.get(`/subjects/${id}`);
  return res.data;
}

// Tạo subject mới
export async function createSubject(payload: Omit<Subject, "id" | "createdAt">): Promise<Subject> {
  const res = await http.post("/subjects", payload);
  return res.data;
}

// Cập nhật subject
export async function updateSubject(
  id: number,
  payload: Partial<Omit<Subject, "id" | "createdAt">>
): Promise<Subject> {
  const res = await http.put(`/subjects/${id}`, payload);
  return res.data;
}

// Xoá subject
export async function deleteSubject(id: number): Promise<void> {
  await http.delete(`/subjects/${id}`);
}
