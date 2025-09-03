import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { startExam, startPractice } from "../../api/attempts";

export default function AttemptConfigPage() {
  const { id: subjectId, chapterId } = useParams();
  const navigate = useNavigate();

  // mode
  const [mode, setMode] = useState<"exam" | "practice">("exam");

  // exam config
  const [questionCount, setQuestionCount] = useState(20);
  const [pageSize, setPageSize] = useState(5);
  const [durationMinutes, setDurationMinutes] = useState(45);

  // practice config
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(20);
  const [orderBy, setOrderBy] = useState<"id.asc" | "id.desc" | "random">("id.asc");

  // common
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [revealAnswerOnSelect, setRevealAnswerOnSelect] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    if (!chapterId || !subjectId) {
      setError("Thiếu subjectId/chapterId trên URL.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      if (mode === "exam") {
        if (questionCount < 1 || pageSize < 1 || durationMinutes < 1) {
          setError("Cấu hình thi không hợp lệ.");
          return;
        }
        if (pageSize > questionCount) {
          setError("Số câu/trang không được lớn hơn số câu.");
          return;
        }

        const payload = {
          userId: 1, // TODO: lấy từ auth context
          subjectId: parseInt(subjectId, 10),
          chapterId: parseInt(chapterId, 10),
          durationMinutes,
          settings: {
            mode: "exam" as const,
            questionCount,
            pageSize,
            shuffleQuestions,
            shuffleOptions,
            revealAnswerOnSelect,
          },
        };
        const res = await startExam(payload);
        navigate(`/attempts/${res.id}`, {
          state: { totals: res.totals, settings: res.settings },
        });
      } else {
        if (limit < 1) {
          setError("Limit phải >= 1.");
          return;
        }

        const payload = {
          userId: 1, // TODO: lấy từ auth context
          subjectId: parseInt(subjectId, 10),
          chapterId: parseInt(chapterId, 10),
          durationMinutes, // optional
          range: { offset, limit },
          settings: {
            mode: "practice" as const,
            revealAnswerOnSelect,
            shuffleQuestions,
            shuffleOptions,
            orderBy,
          },
        };
        const res = await startPractice(payload);
        navigate(`/attempts/${res.id}`, { state: res });
      }
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.error || "Không tạo được attempt.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 560 }}>
      <h1>Cấu hình Attempt</h1>
      <div style={{ color: "#6b7280", marginBottom: 16 }}>
        Subject: {subjectId} · Chapter: {chapterId}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {/* Chọn chế độ */}
        <label>
          Chế độ:
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "exam" | "practice")}
            style={{ marginLeft: 8 }}
          >
            <option value="exam">Thi (Exam)</option>
            <option value="practice">Luyện tập (Practice)</option>
          </select>
        </label>

        {/* Exam fields */}
        {mode === "exam" && (
          <>
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
          </>
        )}

        {/* Practice fields */}
        {mode === "practice" && (
          <>
            <label>
              Offset:
              <input
                type="number"
                value={offset}
                onChange={(e) => setOffset(parseInt(e.target.value || "0", 10))}
                min={0}
                style={{ marginLeft: 8 }}
              />
            </label>

            <label>
              Limit:
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value || "0", 10))}
                min={1}
                style={{ marginLeft: 8 }}
              />
            </label>

            <label>
              Order by:
              <select value={orderBy} onChange={(e) => setOrderBy(e.target.value as any)}>
                <option value="id.asc">ID ↑</option>
                <option value="id.desc">ID ↓</option>
                <option value="random">Random</option>
              </select>
            </label>
          </>
        )}

        {/* Common checkboxes */}
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
          <div
            style={{
              background: "#FEF2F2",
              color: "#991B1B",
              padding: 10,
              borderRadius: 6,
            }}
          >
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
          {submitting ? "Đang tạo..." : "Bắt đầu"}
        </button>
      </div>
    </div>
  );
}
