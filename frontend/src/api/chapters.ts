import { http } from "./http";
import type { Chapter } from "../types/chapter";

// GET /chapters?subjectId=...
export async function getChaptersBySubject(subjectId: number): Promise<Chapter[]> {
  const res = await http.get("/chapters", { params: { subjectId } });
  return res.data;
}

// (optional) lấy chi tiết 1 chapter
export async function getChapterById(id: number): Promise<Chapter> {
  const res = await http.get(`/chapters/${id}`);
  return res.data;
}
