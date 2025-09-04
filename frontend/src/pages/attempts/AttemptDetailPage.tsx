// src/pages/AttemptDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { getAttempt } from "../../api/attempts";
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
        ansList.forEach((a) => {
          map[a.questionId] = a;
        });
        setAnswersByQid(map);
      } catch (err) {
        console.error("Failed to fetch attempt detail", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchAll();
    return () => {
      mounted = false;
    };
  }, [attemptId]);

  // phân trang theo pageIndex
  const pages = useMemo(() => {
    const grouped: Record<number, AttemptQuestion[]> = {};
    for (const aq of aqs) {
      if (!grouped[aq.pageIndex]) grouped[aq.pageIndex] = []; //neu k co tao mang
      grouped[aq.pageIndex].push(aq); //neu co index roi thi se day cau hoi vao
    }
    const sortedIndexes = Object.keys(grouped)
      .map((n) => Number(n))
      .sort((a, b) => a - b); //sort tang dan
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
    upsertAnswer(questionId, {
      selectedOptionIds: Array.from(set),
      value: null,
    });
  }
  function onChangeFill(questionId: number, val: string) {
    if (readOnly) return;
    upsertAnswer(questionId, { selectedOptionIds: null, value: val });
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
        console.log({ //log
          qid: q.id,
          qType: q.type,
          hasOptions: Array.isArray(q.options),
          optionsLen: q.options?.length,
          optionOrder: aq.optionOrder,
        });

        return (
          <div key={aq.id}>
            <p>{q.text}</p>
            {(q.type === "single" || q.type === "multiple" || q.type === "true_false") &&
              opts.map((opt) => (
                <label key={opt.id}>
                  <input
                    type={q.type === "multiple" ? "checkbox" : "radio"}
                    name={`q_${q.id}`}
                    checked={
                      q.type === "multiple"
                        ? ans?.selectedOptionIds?.includes(opt.id)
                        : ans?.selectedOptionIds?.[0] === opt.id
                    }
                    onChange={() =>
                      q.type === "multiple"
                        ? onToggleMulti(q.id, opt.id)
                        : onPickSingle(q.id, opt.id)
                    }
                    disabled={readOnly}
                  />
                  {opt.text}
                </label>
                
              ))}
            {q.type === "fill_blank" && (
              <input
                type="text"
                value={ans?.value ?? ""}
                onChange={(e) => onChangeFill(q.id, e.target.value)}
                readOnly={readOnly}
              />
            )}
          </div>
        );
      })}

      {/* Pagination */}
      <div>
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
    </div>
  );
}
