import { http } from "./http";
import type { CreateAttemptPayload, CreateAttemptResponse, Attempt } from "../types/attempt";

export async function createAttempt(payload: CreateAttemptPayload): Promise<CreateAttemptResponse> {
  const res = await http.post("/attempts", payload);
  return res.data;
}

export async function getAttempt(attemptId: number): Promise<Attempt> {
  const res = await http.get(`/attempts/${attemptId}`);
  return res.data;
}
