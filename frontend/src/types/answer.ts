import type  { Question } from "./question.ts";

export interface Answer {
  id: number;
  attemptId: number;
  questionId: number;
  selectedOptionIds: number[] | null;
  value: string | null;
  isCorrect: boolean | null;
  earnedPoints: number;
  question: Question;
}