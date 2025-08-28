import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getChaptersBySubject } from "../../api/chapters";
import type { Chapter } from "../../types/chapter";
import { getSubjectById } from "../../api/subjects";

export default function ChaptersPage() {
  const { id } = useParams(); // subjectId
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectName, setSubjectName] = useState("");

  useEffect(() => {
    if (!id) return;
    const subjectId = parseInt(id, 10);
    getChaptersBySubject(subjectId)
      .then(setChapters)  //thanh cong thi set chapter vao dong so 10
      .catch((err) => console.error("Lỗi khi load chapters:", err))
      .finally(() => setLoading(false));
  }, [id]);
  
  useEffect(() => {
    if (!id) return;
    getSubjectById(parseInt(id, 10))
      .then((s) => setSubjectName(s.name))
      .catch((err) => console.error("Lỗi khi load subject:", err));
  }, [id]);
  

  if (loading) return <div>Đang tải danh sách chương...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Danh sách chương (Subject {id} : {subjectName})</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
        {chapters.map((c) => (
          <button
            key={c.id}
            style={{
              padding: "12px 16px",
              borderRadius: 6,
              border: "1px solid #ddd",
              background: "#f9f9f9",
              cursor: "pointer",
              textAlign: "left",
            }}
            onClick={() => navigate(`/subjects/${id}/chapters/${c.id}/config`)}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
