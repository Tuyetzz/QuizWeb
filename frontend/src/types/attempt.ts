export type AttemptStatus = "draft" | "in_progress" | "submitted" | "expired" | "graded";

export interface AttemptSettings {
  questionCount: number;
  pageSize: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  revealAnswerOnSelect: boolean;
}

export interface Attempt {
  id: number;
  userId: number;           // tạm thời có thể hardcode 1 user test
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

export interface CreateAttemptPayload extends AttemptSettings {
  chapterId: number;
  durationMinutes: number;
  // nếu backend cần thêm subjectId/userId thì thêm tại đây
}

export interface CreateAttemptResponse {
  id: number;               // attemptId trả về từ BE
  // nếu BE trả thêm metadata (totalPages/totalQuestions/...), thêm field ở đây
}
