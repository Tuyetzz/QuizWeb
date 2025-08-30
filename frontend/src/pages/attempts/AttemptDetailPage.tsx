import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { http } from "../../api/http";

interface Option {
  id: number;
  text: string;
  isCorrect: boolean;
  order: number;
}

interface Question {
  id: number;
  text: string;
  type: "single" | "multiple" | "true_false" | "fill_blank";
  options?: Option[];
}

interface Answer {
  id: number;
  attemptId: number;
  questionId: number;
  selectedOptionIds: number[] | null;
  value: string | null;
  isCorrect: boolean | null;
  earnedPoints: number;
  question: Question;
}

export default function AttemptDetailPage() {
  const { id } = useParams(); // attemptId
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Gọi BE lấy tất cả answers của attempt
        const res = await http.get(`/answers/attempt/${id}`);
        setAnswers(res.data);
      } catch (err) {
        console.error("Error fetching attempt answers", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return <p>Đang tải đề thi...</p>;
  if (!answers.length) return <p>Không có câu hỏi trong attempt này.</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Attempt #{id}</h1>
      <div style={{ display: "grid", gap: 20 }}>
        {answers.map((ans, index) => (
          <div
            key={ans.id}
            style={{
              padding: 16,
              border: "1px solid #ddd",
              borderRadius: 8,
              background: "#fafafa",
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <b>Câu {index + 1}:</b> {ans.question.text}
            </div>

            {/* Render options nếu là single/multiple */}
            {(ans.question.type === "single" || ans.question.type === "multiple") &&
              ans.question.options?.map((opt) => (
                <label key={opt.id} style={{ display: "block", marginBottom: 8 }}>
                  <input
                    type={ans.question.type === "single" ? "radio" : "checkbox"}
                    name={`q_${ans.questionId}`}
                    value={opt.id}
                    checked={ans.selectedOptionIds?.includes(opt.id) || false}
                    readOnly
                  />
                  {opt.text}
                </label>
              ))}

            {/* True/False */}
            {ans.question.type === "true_false" && (
              <div>
                <label>
                  <input
                    type="radio"
                    name={`q_${ans.questionId}`}
                    value="true"
                    checked={ans.selectedOptionIds?.includes(1) || false}
                    readOnly
                  />
                  Đúng
                </label>
                <label style={{ marginLeft: 20 }}>
                  <input
                    type="radio"
                    name={`q_${ans.questionId}`}
                    value="false"
                    checked={ans.selectedOptionIds?.includes(0) || false}
                    readOnly
                  />
                  Sai
                </label>
              </div>
            )}

            {/* Fill blank */}
            {ans.question.type === "fill_blank" && (
              <input
                type="text"
                value={ans.value || ""}
                readOnly
                style={{ border: "1px solid #ccc", padding: 4 }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
