import { http } from "./http";
import type { User } from "../types/user";

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { name: string; email: string; password: string; }
export interface LoginResponse { accessToken: string; user: User; }

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  try {
    console.log("Login payload:", payload);
    const { data } = await http.post("/auth/login", payload);
    console.log("Login response:", data);
    return data;
  } catch (err: any) {
    if (err.response) {
      console.error("Login error:", err.response.status, err.response.data);
    } else {
      console.error("Login error:", err);
    }
    throw err;
  }
}



export async function register(payload: RegisterPayload): Promise<User> {
  const { data } = await http.post("/auth/register", payload);
  return data; // backend thường trả user mới (không có passwordHash)
}

export async function getMe(): Promise<User> {
  const { data } = await http.get("/auth/me");
  return data;
}

export async function logout(): Promise<void> {
  await http.post("/auth/logout");
}
