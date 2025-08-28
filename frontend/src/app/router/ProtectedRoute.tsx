import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 20 }}>Đang kiểm tra phiên đăng nhập…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
