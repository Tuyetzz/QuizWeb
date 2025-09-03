// /types/attempt.ts
import type { Question } from "./question";

// ----- Common -----
export type AttemptStatus =
  | "draft"
  | "in_progress"
  | "submitted"
  | "expired"
  | "graded";

export type AttemptMode = "exam" | "practice";
export type OrderBy = "id.asc" | "id.desc" | "random";

// ----- Attempt record (đọc lại từ BE) -----
export interface AttemptSettings {
  // dùng chung cho cả 2 chế độ
  mode: AttemptMode;

  // exam
  questionCount?: number;
  pageSize?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  revealAnswerOnSelect?: boolean;

  // practice
  orderBy?: OrderBy;
  range?: { offset: number; limit: number };
}

export interface Attempt {
  id: number;
  userId: number;
  subjectId: number | null;
  chapterId: number | null;
  status: AttemptStatus;
  startedAt: string | null;
  submittedAt: string | null;
  durationMinutes: number;
  timeSpentSeconds: number;
  settings: AttemptSettings | null;
  score: number;
  maxScore: number;
  createdAt: string;
  updatedAt: string;
}

// ----- Payloads -----
export interface StartExamPayload {
  userId: number;
  subjectId: number;
  chapterId: number;
  durationMinutes: number; // bắt buộc
  settings: {
    mode: "exam";
    questionCount: number;
    pageSize: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    revealAnswerOnSelect: boolean; // thường là false cho thi thật
  };
}

export interface StartPracticePayload {
  userId: number;
  subjectId: number;
  chapterId: number;
  // optional, vì practice có thể set mặc định (vd 120)
  durationMinutes?: number;
  range: { offset: number; limit: number }; // ví dụ block 51–100 → offset=50, limit=50
  settings: {
    mode: "practice";
    revealAnswerOnSelect: boolean;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    orderBy?: OrderBy;
  };
}

// Cho phép truyền chung vào hàm nếu muốn
export type CreateAttemptPayload = StartExamPayload | StartPracticePayload;

// ----- Responses -----
// Metadata khi start EXAM
export interface ExamStartResponse {
  id: number;
  startedAt: string;
  expiresAt: string;
  settings: {
    mode: "exam";
    questionCountRequested: number;
    questionCountUsed: number;
    pageSize: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    revealAnswerOnSelect: boolean;
  };
  totals: {
    totalAvailable: number;
    totalQuestions: number; // = questionCountUsed
    totalPages: number;
    maxScore: number;
  };
}

// Metadata + câu hỏi khi start PRACTICE
export interface PracticeStartResponse {
  id: number;
  mode: "practice";
  startedAt: string;
  range: { offset: number; limit: number };
  totals: { totalAvailable: number; returned: number };
  settings: {
    revealAnswerOnSelect: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    orderBy: OrderBy;
  };
  // practice có thể trả sẵn danh sách câu cho block đã chọn
  items: Question[];
}

// Union cho hàm startAttempt nếu dùng 1 endpoint rẽ nhánh theo settings.mode
export type CreateAttemptResponse =
  | ExamStartResponse
  | PracticeStartResponse;
