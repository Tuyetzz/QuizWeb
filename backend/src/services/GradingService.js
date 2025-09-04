// services/GradingService.js
const sequelize = require("../config/db");
const Attempt = require("../models/Attempt");
const AttemptQuestion = require("../models/AttemptQuestion");
const Question = require("../models/Question");
const Option = require("../models/Option");
const Answer = require("../models/Answer");

// ===== Helpers
const toSet = (arr) => new Set(Array.isArray(arr) ? arr : []);
const now = () => new Date();

const stripDiacritics = (s) =>
  s
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

const normalizeText = (s) =>
  stripDiacritics(String(s ?? "").trim().toLowerCase());

function resolvePolicy(attempt) {
  // Ví dụ policy mặc định, có thể tuỳ biến theo attempt.settings.grading
  const g = attempt?.settings?.grading || {};
  return {
    partialCredit: !!g.partialCredit,          // true -> multiple có điểm thành phần
    penaltyPerWrong: Number(g.penaltyPerWrong ?? 0),
    fillBlank: {
      // exact: so khớp exact sau normalize
      // regex: cho phép so khớp với biểu thức chính quy trong explanation (nếu có)
      mode: g.fillBlank?.mode ?? "exact", // "exact" | "regex"
    },
    passThreshold: Number(g.passThreshold ?? 0), // nếu cần
  };
}

function gradeMultiple({ selected = [], correct = [], points, policy }) {
  const sel = toSet(selected);
  const corr = toSet(correct);
  const allCorrectChosen = [...corr].every((id) => sel.has(id));
  const noWrongChosen = [...sel].every((id) => corr.has(id));

  if (!policy.partialCredit) {
    return allCorrectChosen && noWrongChosen ? points : 0;
  }

  // Partial credit
  const correctChosen = [...sel].filter((id) => corr.has(id)).length;
  const wrongChosen = [...sel].filter((id) => !corr.has(id)).length;
  const base = (correctChosen / Math.max(1, corr.size)) * points;
  const penalty = (policy.penaltyPerWrong ?? 0) * wrongChosen;
  return Math.max(0, Math.min(points, base - penalty));
}

function gradeFillBlank({ value, expectedRaw, points, policy }) {
  if (!value) return { isCorrect: false, earned: 0 };

  const expected = String(expectedRaw ?? "").trim();
  if (!expected) return { isCorrect: false, earned: 0 }; // không có đáp án chuẩn

  if (policy.fillBlank?.mode === "regex") {
    try {
      const re = new RegExp(expected, "i");
      const ok = re.test(String(value));
      return { isCorrect: ok, earned: ok ? points : 0 };
    } catch {
      // fallback về exact nếu regex lỗi
    }
  }

  const a = normalizeText(value);
  const b = normalizeText(expected);
  const ok = a.length > 0 && a === b;
  return { isCorrect: ok, earned: ok ? points : 0 };
}

async function loadAttemptContext({ attemptId, transaction }) {
  const aqs = await AttemptQuestion.findAll({
    where: { attemptId },
    transaction,
  });
  const questionIds = aqs.map((q) => q.questionId);

  const [questions, options, answers] = await Promise.all([
    Question.findAll({ where: { id: questionIds }, transaction }),
    Option.findAll({ where: { questionId: questionIds }, transaction }),
    Answer.findAll({ where: { attemptId }, transaction }),
  ]);

  const qById = new Map(questions.map((q) => [q.id, q]));
  const optsByQ = options.reduce((acc, o) => {
    (acc[o.questionId] ||= []).push(o);
    return acc;
  }, {});
  const ansByQ = new Map(answers.map((a) => [a.questionId, a]));

  return { aqs, qById, optsByQ, ansByQ };
}

// ===== Public API
module.exports.gradeAttempt = async ({ attemptId, userId, force = false }) => {
  return await sequelize.transaction(async (t) => {
    // 1) Lock attempt
    const attempt = await Attempt.findOne({
      where: userId ? { id: attemptId, userId } : { id: attemptId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!attempt) throw new Error("Attempt không tồn tại");

    // Idempotent / trạng thái không hợp lệ
    if (!force) {
      if (attempt.status === "graded") {
        return {
          attemptId: attempt.id,
          status: attempt.status,
          score: attempt.score,
          maxScore: attempt.maxScore,
          submittedAt: attempt.submittedAt,
        };
      }
      if (attempt.expiresAt && now() > attempt.expiresAt) {
        attempt.status = "expired";
        await attempt.save({ transaction: t });
        return {
          attemptId: attempt.id,
          status: "expired",
          score: 0,
          maxScore: attempt.maxScore ?? 0,
        };
      }
    }

    // 2) Load context
    const { aqs, qById, optsByQ, ansByQ } = await loadAttemptContext({
      attemptId: attempt.id,
      transaction: t,
    });

    const policy = resolvePolicy(attempt);

    // 3) Grade per question
    let total = 0;
    let maxScore = 0;

    for (const aq of aqs) {
      const q = qById.get(aq.questionId);
      if (!q) continue;

      const pts = Number(q.points ?? 1);
      maxScore += pts;

      const qOpts = optsByQ[q.id] || [];
      const correctIds = qOpts.filter((o) => o.isCorrect).map((o) => o.id);

      const ans = ansByQ.get(q.id); // có thể undefined nếu chưa trả lời
      let earned = 0;
      let isCorrect = null;

      if (q.type === "single" || q.type === "true_false") {
        const chosen = Array.isArray(ans?.selectedOptionIds)
          ? ans.selectedOptionIds[0] ?? null
          : null;
        isCorrect =
          chosen != null && correctIds.length === 1 && chosen === correctIds[0];
        earned = isCorrect ? pts : 0;
      } else if (q.type === "multiple") {
        const selected = Array.isArray(ans?.selectedOptionIds)
          ? ans.selectedOptionIds
          : [];
        earned = gradeMultiple({
          selected,
          correct: correctIds,
          points: pts,
          policy,
        });
        // Nếu muốn coi "đúng" là đạt full điểm:
        isCorrect = earned === pts;
      } else if (q.type === "fill_blank") {
        const { isCorrect: ok, earned: e } = gradeFillBlank({
          value: ans?.value,
          expectedRaw: q.explanation, // hoặc tách cột answerKey riêng nếu bạn có
          points: pts,
          policy,
        });
        isCorrect = ok;
        earned = e;
      }

      // Cập nhật / tạo Answer (để lưu earnedPoints)
      if (ans) {
        ans.isCorrect = isCorrect;
        ans.earnedPoints = earned;
        if (!ans.answeredAt) ans.answeredAt = now();
        await ans.save({ transaction: t });
      } else {
        await Answer.create(
          {
            attemptId: attempt.id,
            questionId: q.id,
            selectedOptionIds: null,
            value: null,
            isCorrect,
            earnedPoints: earned,
            answeredAt: now(),
            flagged: false,
          },
          { transaction: t }
        );
      }

      total += earned;
    }

    // 4) Roll-up Attempt
    attempt.score = total;
    attempt.maxScore = maxScore;
    attempt.submittedAt = attempt.submittedAt ?? now();
    attempt.status = "graded"; // hoặc "submitted" nếu muốn chia 2 bước
    // Option: tính timeSpent từ startedAt
    // if (attempt.startedAt) {
    //   attempt.timeSpentSeconds = Math.max(
    //     attempt.timeSpentSeconds ?? 0,
    //     Math.floor((now() - attempt.startedAt) / 1000)
    //   );
    // }
    await attempt.save({ transaction: t });

    return {
      attemptId: attempt.id,
      status: attempt.status,
      score: attempt.score,
      maxScore: attempt.maxScore,
      submittedAt: attempt.submittedAt,
    };
  });
};

// Re-grade tiện dụng khi đổi đáp án/điểm câu hỏi
module.exports.regradeAttempt = async ({ attemptId }) => {
  return await sequelize.transaction(async (t) => {
    const attempt = await Attempt.findOne({
      where: { id: attemptId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!attempt) throw new Error("Attempt không tồn tại");

    const { aqs, qById, optsByQ, ansByQ } = await loadAttemptContext({
      attemptId,
      transaction: t,
    });

    const policy = resolvePolicy(attempt);

    let total = 0;
    let maxScore = 0;

    for (const aq of aqs) {
      const q = qById.get(aq.questionId);
      if (!q) continue;

      const pts = Number(q.points ?? 1);
      maxScore += pts;

      const qOpts = optsByQ[q.id] || [];
      const correctIds = qOpts.filter((o) => o.isCorrect).map((o) => o.id);
      const ans = ansByQ.get(q.id);

      let earned = 0;
      let isCorrect = null;

      if (q.type === "single" || q.type === "true_false") {
        const chosen = Array.isArray(ans?.selectedOptionIds)
          ? ans.selectedOptionIds[0] ?? null
          : null;
        isCorrect =
          chosen != null && correctIds.length === 1 && chosen === correctIds[0];
        earned = isCorrect ? pts : 0;
      } else if (q.type === "multiple") {
        const selected = Array.isArray(ans?.selectedOptionIds)
          ? ans.selectedOptionIds
          : [];
        earned = gradeMultiple({
          selected,
          correct: correctIds,
          points: pts,
          policy,
        });
        isCorrect = earned === pts;
      } else if (q.type === "fill_blank") {
        const { isCorrect: ok, earned: e } = gradeFillBlank({
          value: ans?.value,
          expectedRaw: q.explanation,
          points: pts,
          policy,
        });
        isCorrect = ok;
        earned = e;
      }

      if (ans) {
        ans.isCorrect = isCorrect;
        ans.earnedPoints = earned;
        await ans.save({ transaction: t });
      } else {
        await Answer.create(
          {
            attemptId,
            questionId: q.id,
            selectedOptionIds: null,
            value: null,
            isCorrect,
            earnedPoints: earned,
            answeredAt: now(),
            flagged: false,
          },
          { transaction: t }
        );
      }

      total += earned;
    }

    attempt.score = total;
    attempt.maxScore = maxScore;
    attempt.status = "graded";
    await attempt.save({ transaction: t });

    return {
      attemptId: attempt.id,
      status: attempt.status,
      score: attempt.score,
      maxScore: attempt.maxScore,
      submittedAt: attempt.submittedAt,
    };
  });
};
