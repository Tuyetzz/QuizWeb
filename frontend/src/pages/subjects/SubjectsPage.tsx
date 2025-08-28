import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSubjects } from "../../api/subjects";
import type { Subject } from "../../types/subject";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getSubjects()
      .then((data) => setSubjects(data))
      .catch((err) => console.error("Lỗi khi load subjects:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Đang tải danh sách môn...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Danh sách môn</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
        {subjects.map((s) => (
          <button
            key={s.id}
            style={{
              padding: "12px 16px",
              borderRadius: 6,
              border: "1px solid #ddd",
              background: "#f9f9f9",
              cursor: "pointer",
              textAlign: "left",
            }}
            onClick={() => navigate(`/subjects/${s.id}/chapters`)}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
