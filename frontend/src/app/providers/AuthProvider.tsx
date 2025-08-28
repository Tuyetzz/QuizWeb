import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "../../types/user";
import { getMe, login as apiLogin, logout as apiLogout } from "../../api/auth";
import { http } from "../../api/http";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Khởi động: nếu có token thì gọi /auth/me để lấy user
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { setLoading(false); return; }
    // đã set interceptor nên chỉ cần gọi getMe
    getMe().then(setUser).catch(() => {
      localStorage.removeItem("accessToken");
    }).finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await apiLogin({ email, password });
    localStorage.setItem("accessToken", res.accessToken);

    // attach token cho axios
    http.defaults.headers.common.Authorization = `Bearer ${res.accessToken}`;

    // gọi /auth/me để lấy thông tin user
    const me = await getMe();
    setUser(me);
  }


  async function logout() {
    try { await apiLogout(); } catch {}
    localStorage.removeItem("accessToken");
    delete http.defaults.headers.common.Authorization;
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
