import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { startAttempt  } from "../../api/attempts";

export default function ExamConfigPage() {
  const { id: subjectId, chapterId } = useParams(); // /subjects/:id/chapters/:chapterId/config
  const navigate = useNavigate();

  const [questionCount, setQuestionCount] = useState(20);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [revealAnswerOnSelect, setRevealAnswerOnSelect] = useState(false);
  const [pageSize, setPageSize] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    if (!chapterId || !subjectId) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        userId: 1, // TODO: lấy từ auth context
        subjectId: parseInt(subjectId, 10),
        chapterId: parseInt(chapterId, 10),
        durationMinutes,
        settings: {
          questionCount,
          pageSize,
          shuffleQuestions,
          shuffleOptions,
          revealAnswerOnSelect,
        },
      };
      const res = await startAttempt(payload);
      navigate(`/attempts/${res.id}`);
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.error || "Không tạo được attempt. Kiểm tra log/BE.");
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <div style={{ padding: 20, maxWidth: 560 }}>
      <h1>Cấu hình đề thi</h1>
      <div style={{ color: "#6b7280", marginBottom: 16 }}>
        Subject: {subjectId} · Chapter: {chapterId}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <label>
          Số lượng câu:
          <input
            type="number"
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value || "0", 10))}
            min={1}
            style={{ marginLeft: 8 }}
          />
        </label>

        <label>
          Thời gian làm bài (phút):
          <input
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(parseInt(e.target.value || "0", 10))}
            min={1}
            style={{ marginLeft: 8 }}
          />
        </label>

        <label>
          Số câu / trang:
          <input
            type="number"
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value || "0", 10))}
            min={1}
            style={{ marginLeft: 8 }}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={shuffleQuestions}
            onChange={(e) => setShuffleQuestions(e.target.checked)}
          />
          Shuffle câu hỏi
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={shuffleOptions}
            onChange={(e) => setShuffleOptions(e.target.checked)}
          />
          Shuffle phương án
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={revealAnswerOnSelect}
            onChange={(e) => setRevealAnswerOnSelect(e.target.checked)}
          />
          Hiển thị đáp án ngay sau khi chọn
        </label>

        {error && (
          <div style={{ background: "#FEF2F2", color: "#991B1B", padding: 10, borderRadius: 6 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={submitting}
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            border: "1px solid #ddd",
            background: submitting ? "#ddd" : "#e5ffe5",
            cursor: submitting ? "not-allowed" : "pointer",
            marginTop: 8,
            width: 160,
          }}
        >
          {submitting ? "Đang tạo..." : "Bắt đầu thi"}
        </button>
      </div>
    </div>
  );
}
