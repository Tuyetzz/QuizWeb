import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as apiRegister } from "../../api/auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setOk(null);
    try {
      await apiRegister({ name, email, password });
      setOk("Đăng ký thành công. Mời bạn đăng nhập.");
      setTimeout(() => navigate("/login"), 800);
    } catch (e: any) {
      setErr("Đăng ký thất bại. Email có thể đã tồn tại.");
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "60px auto", padding: 20 }}>
      <h1>Đăng ký</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <input placeholder="Họ tên" value={name} onChange={(e)=>setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input placeholder="Mật khẩu" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        {err && <div style={{ color: "#b91c1c" }}>{err}</div>}
        {ok && <div style={{ color: "#065f46" }}>{ok}</div>}
        <button type="submit">Tạo tài khoản</button>
      </form>
      <div style={{ marginTop: 12 }}>
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </div>
    </div>
  );
}
