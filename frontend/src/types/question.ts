import type { Option } from "./options";

export type QuestionType = "single" | "multiple" | "true_false" | "fill_blank";

export interface Question {
  id: number;
  text: string;
  type: "single" | "multiple" | "true_false" | "fill_blank";
  options?: Option[];
}