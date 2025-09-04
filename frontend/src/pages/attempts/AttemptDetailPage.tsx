// src/pages/AttemptDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { getAttempt /* bỏ updateAttempt */, submitAttempt } from "../../api/attempts";
import { getAttemptQuestions } from "../../api/attemptsQuestion";
import { getAnswersByAttempt, createAnswer, updateAnswer } from "../../api/answer";
import type { AttemptQuestion } from "../../types/attemptsquestion";
import type { Answer } from "../../types/answer";
import type { Option } from "../../types/options";

export default function AttemptDetailPage() {
  const { id } = useParams();
  const attemptId = Number(id);

  const [attempt, setAttempt] = useState<any>(null);
  const [aqs, setAqs] = useState<AttemptQuestion[]>([]);
  const [answersByQid, setAnswersByQid] = useState<Record<number, Answer>>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  // submit states
  const [submitting, setSubmitting] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [scoreVal, setScoreVal] = useState<number | null>(null);
  const [maxScoreVal, setMaxScoreVal] = useState<number | null>(null);
  const [statusVal, setStatusVal] = useState<string | null>(null);
  const pct = scoreVal != null && maxScoreVal ? Math.round((scoreVal / maxScoreVal) * 100) : null;

  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      try {
        const [att, aqList, ansList] = await Promise.all([
          getAttempt(attemptId),
          getAttemptQuestions(attemptId),
          getAnswersByAttempt(attemptId),
        ]);
        if (!mounted) return;
        setAttempt(att);
        setAqs(aqList);

        const map: Record<number, Answer> = {};
        ansList.forEach((a) => { map[a.questionId] = a; });
        setAnswersByQid(map);
      } catch (err) {
        console.error("Failed to fetch attempt detail", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchAll();
    return () => { mounted = false; };
  }, [attemptId]);

  const pages = useMemo(() => {
    const grouped: Record<number, AttemptQuestion[]> = {};
    for (const aq of aqs) {
      if (!grouped[aq.pageIndex]) grouped[aq.pageIndex] = [];
      grouped[aq.pageIndex].push(aq);
    }
    const sortedIndexes = Object.keys(grouped).map(Number).sort((a, b) => a - b);
    return sortedIndexes.map((i) => grouped[i]);
  }, [aqs]);

  const totalPages = pages.length || 1;
  const currentPageItems = pages[currentPage] ?? [];

  const readOnly = attempt?.status !== "in_progress";

  function orderedOptions(options?: Option[], order?: number[] | null): Option[] {
    if (!options) return [];
    if (!order) return options;
    const rank = new Map(order.map((id, idx) => [id, idx]));
    return options.slice().sort((a, b) => {
      const ra = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const rb = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return ra - rb;
    });
  }

  async function upsertAnswer(questionId: number, patch: Partial<Answer>) {
    const prev = answersByQid[questionId];
    try {
      let res: Answer;
      if (prev?.id) {
        res = await updateAnswer(prev.id, patch);
      } else {
        res = await createAnswer(attemptId, questionId, patch);
      }
      setAnswersByQid((m) => ({ ...m, [questionId]: res }));
    } catch (err) {
      console.error("Save answer failed", err);
    }
  }

  function onPickSingle(questionId: number, optionId: number) {
    if (readOnly) return;
    upsertAnswer(questionId, { selectedOptionIds: [optionId], value: null });
  }
  function onToggleMulti(questionId: number, optionId: number) {
    if (readOnly) return;
    const cur = answersByQid[questionId]?.selectedOptionIds ?? [];
    const set = new Set(cur);
    set.has(optionId) ? set.delete(optionId) : set.add(optionId);
    upsertAnswer(questionId, { selectedOptionIds: Array.from(set), value: null });
  }
  function onChangeFill(questionId: number, val: string) {
    if (readOnly) return;
    upsertAnswer(questionId, { selectedOptionIds: null, value: val });
  }

  // ===== SUBMIT & SHOW MODAL =====
  async function onSubmitAttempt() {
    if (readOnly || submitting) return;
    try {
      setSubmitting(true);
      // Gọi endpoint chấm điểm
      const result = await submitAttempt(attemptId); // POST /attempts/:id/submit
      // Backend trả: { status, score, maxScore, submittedAt, ... }
      setScoreVal(result.score ?? null);
      setMaxScoreVal(result.maxScore ?? null);
      setStatusVal(result.status ?? null);
      setScoreOpen(true);

      // Cập nhật local attempt để bật readOnly, v.v.
      setAttempt((prev: any) => ({ ...(prev || {}), ...result }));
  } catch (e: any) {
    console.error("Submit attempt error:", e);
    console.error("Response data:", e?.response?.data); // log JSON từ backend
    alert(e?.response?.data?.error || "Có lỗi khi nộp bài");
  } finally {
    setSubmitting(false);
  }
}

  if (loading) return <p>Đang tải đề...</p>;

  return (
    <div>
      <h1>Attempt #{attemptId}</h1>

      {currentPageItems.map((aq) => {
        const q = aq.question;
        if (!q) return null;
        const ans = answersByQid[q.id];
        const opts = orderedOptions(q.options, aq.optionOrder);

        return (
          <div key={aq.id} style={{ marginBottom: 16, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
            <p style={{ fontWeight: 600 }}>{q.text}</p>

            {(q.type === "single" || q.type === "multiple" || q.type === "true_false") &&
              opts.map((opt) => (
                <label key={opt.id} style={{ display: "block", marginTop: 6 }}>
                  <input
                    type={q.type === "multiple" ? "checkbox" : "radio"}
                    name={`q_${q.id}`}
                    checked={
                      q.type === "multiple"
                        ? ans?.selectedOptionIds?.includes(opt.id)
                        : ans?.selectedOptionIds?.[0] === opt.id
                    }
                    onChange={() =>
                      q.type === "multiple" ? onToggleMulti(q.id, opt.id) : onPickSingle(q.id, opt.id)
                    }
                    disabled={readOnly}
                  />
                  <span style={{ marginLeft: 8 }}>{opt.text}</span>
                </label>
              ))}

            {q.type === "fill_blank" && (
              <input
                type="text"
                value={ans?.value ?? ""}
                onChange={(e) => onChangeFill(q.id, e.target.value)}
                readOnly={readOnly}
                style={{ marginTop: 8, padding: 6, border: "1px solid #ccc", borderRadius: 6 }}
              />
            )}
          </div>
        );
      })}

      {/* Pagination */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button disabled={currentPage <= 0} onClick={() => setCurrentPage((p) => p - 1)}>
          Trang trước
        </button>
        <span>
          {currentPage + 1} / {totalPages}
        </span>
        <button
          disabled={currentPage >= totalPages - 1}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          Trang sau
        </button>
      </div>

      {/* Submit */}
      <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={onSubmitAttempt} disabled={readOnly || submitting}>
          {submitting ? "Đang nộp..." : "Nộp bài"}
        </button>
        {readOnly && <small style={{ opacity: 0.7 }}>Bài đã không còn ở trạng thái làm bài.</small>}
      </div>

      {/* ===== MODAL KẾT QUẢ ===== */}
      {scoreOpen && (
        <div role="dialog" aria-modal="true"
             style={{
               position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50
             }}>
          {/* backdrop */}
          <div onClick={() => setScoreOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />

          {/* content */}
          <div style={{
            position: "relative", zIndex: 10, width: "100%", maxWidth: 420, background: "#fff",
            borderRadius: 12, padding: 16, boxShadow: "0 10px 30px rgba(0,0,0,.15)"
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Kết quả</h2>

            <div style={{ lineHeight: 1.6 }}>
              <div>
                Điểm: <strong>{scoreVal ?? "-"}</strong> / <strong>{maxScoreVal ?? "-"}</strong>
                {pct != null && <span> ({pct}%)</span>}
              </div>
              {statusVal && <div>Trạng thái: <strong>{statusVal}</strong></div>}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={() => setScoreOpen(false)} style={{ padding: "8px 14px", borderRadius: 10, background: "#111", color: "#fff" }}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
