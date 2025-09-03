// /types/attemptsquestion.ts
import type { Question } from "./question";

export interface AttemptQuestion {
  id: number;
  attemptId: number;
  questionId: number;
  optionOrder: number[] | null; // giữ thứ tự option sau khi shuffle
  pageIndex: number;
  question?: Question; // nếu bạn include luôn Question khi query
}
