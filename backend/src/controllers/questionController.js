const Question = require("../models/Question");
const Subject = require("../models/Subject");
const Chapter = require("../models/Chapter");
const Option = require("../models/Option");
const sequelize = require("../config/db"); // để mở transaction nếu cần

// Lấy tất cả questions (có thể filter theo subjectId, chapterId, type, difficulty)
exports.getAllQuestions = async (req, res) => {
  try {
    const { subjectId, chapterId, type, difficulty } = req.query;
    const where = {};
    if (subjectId) where.subjectId = subjectId;
    if (chapterId) where.chapterId = chapterId;
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;

    const questions = await Question.findAll({
      where,
      include: [
        { model: Subject, as: "subject", attributes: ["id", "name", "slug"] },
        { model: Chapter, as: "chapter", attributes: ["id", "name", "order"] }
      ],
      order: [["id", "DESC"]]
    });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy questions", details: err.message });
  }
};

// Lấy 1 question
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id, {
      include: [
        { model: Subject, as: "subject", attributes: ["id", "name", "slug"] },
        { model: Chapter, as: "chapter", attributes: ["id", "name", "order"] }
      ]
    });
    if (!question) {
      return res.status(404).json({ error: "Question không tồn tại" });
    }
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy question", details: err.message });
  }
};

// Tạo mới question
exports.createQuestion = async (req, res) => {
  try {
    const { subjectId, chapterId, type, text, explanation, difficulty, points, media, tags } = req.body;

    // validate subject + chapter
    const subject = await Subject.findByPk(subjectId);
    if (!subject) return res.status(400).json({ error: "Subject không tồn tại" });

    const chapter = await Chapter.findByPk(chapterId);
    if (!chapter) return res.status(400).json({ error: "Chapter không tồn tại" });

    const question = await Question.create({
      subjectId,
      chapterId,
      type,
      text,
      explanation,
      difficulty,
      points,
      media,
      tags
    });

    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi tạo question", details: err.message });
  }
};

// Cập nhật question
exports.updateQuestion = async (req, res) => {
  try {
    const { subjectId, chapterId, type, text, explanation, difficulty, points, media, tags } = req.body;

    const question = await Question.findByPk(req.params.id);
    if (!question) return res.status(404).json({ error: "Question không tồn tại" });

    if (subjectId) {
      const subject = await Subject.findByPk(subjectId);
      if (!subject) return res.status(400).json({ error: "Subject không tồn tại" });
    }
    if (chapterId) {
      const chapter = await Chapter.findByPk(chapterId);
      if (!chapter) return res.status(400).json({ error: "Chapter không tồn tại" });
    }

    await question.update({ subjectId, chapterId, type, text, explanation, difficulty, points, media, tags });
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi cập nhật question", details: err.message });
  }
};

// Xóa question
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) return res.status(404).json({ error: "Question không tồn tại" });

    await question.destroy();
    res.json({ message: "Xóa question thành công" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi xóa question", details: err.message });
  }
};

// Helper validate theo type
function validateQuestionPayload(q) {
  if (!q || !q.text) return "Thiếu text";
  const type = q.type || "single";
  const opts = Array.isArray(q.options) ? q.options : [];

  if (type === "fill_blank") {
    if (opts.length > 0) return "fill_blank không dùng options";
    return null;
  }

  // single / multiple / true_false
  if (type === "true_false") {
    if (opts.length !== 2) return "true_false phải có đúng 2 options";
  } else {
    if (opts.length < 2) return "Cần >= 2 options";
  }

  const correctCount = opts.filter(o => o && o.isCorrect === true).length;
  if (type === "single" || type === "true_false") {
    if (correctCount !== 1) return "Cần đúng 1 đáp án đúng";
  } else if (type === "multiple") {
    if (correctCount < 1) return "multiple cần >=1 đáp án đúng";
  }

  if (opts.some(o => !o || !o.text)) return "Option thiếu text";
  return null;
}

// {
//   "mode": "all-or-nothing",
//   "subjectId": 1,
//   "chapterId": 1,
//   "type": "single",
//   "items": [
//     {
//       "text": "Giải x: 2x + 3 = 7",
//       "explanation": "2x = 4 => x = 2",
//       "difficulty": 1,
//       "points": 1,
//       "options": [
//         { "text": "1", "isCorrect": false, "order": 1 },
//         { "text": "2", "isCorrect": true,  "order": 2 },
//         { "text": "3", "isCorrect": false, "order": 3 },
//         { "text": "4", "isCorrect": false, "order": 4 }
//       ]
//     },
exports.batchCreateQuestions = async (req, res) => {
  const { items, mode = "partial" } = req.body || {};
  const defaultSubjectId = req.body.subjectId;
  const defaultChapterId = req.body.chapterId;
  const defaultType = req.body.type;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Body.items phải là mảng và không rỗng" });
  }

  // Kiểm tra subject/chapter default (nếu gửi)
  try {
    if (defaultSubjectId) {
      const s = await Subject.findByPk(defaultSubjectId);
      if (!s) return res.status(400).json({ error: "Subject mặc định không tồn tại" });
    }
    if (defaultChapterId) {
      const c = await Chapter.findByPk(defaultChapterId);
      if (!c) return res.status(400).json({ error: "Chapter mặc định không tồn tại" });
    }
  } catch (e) {
    return res.status(500).json({ error: "Lỗi khi kiểm tra subject/chapter mặc định", details: e.message });
  }

  // all-or-nothing: gói vào 1 transaction
  if (mode === "all-or-nothing") {
    const t = await sequelize.transaction();
    try {
      const createdIds = [];

      for (let i = 0; i < items.length; i++) {
        const raw = items[i] || {};
        const payload = {
          subjectId: raw.subjectId ?? defaultSubjectId,
          chapterId: raw.chapterId ?? defaultChapterId,
          type: (raw.type ?? defaultType ?? "single"),
          text: raw.text,
          explanation: raw.explanation ?? null,
          difficulty: raw.difficulty ?? 1,
          points: raw.points ?? 1,
          media: raw.media ?? null,
          tags: raw.tags ?? null,
          options: raw.options || []
        };

        if (!payload.subjectId) throw new Error(`(row ${i}) Thiếu subjectId`);
        if (!payload.chapterId) throw new Error(`(row ${i}) Thiếu chapterId`);

        // tồn tại subject/chapter?
        const [s, c] = await Promise.all([
          Subject.findByPk(payload.subjectId, { transaction: t }),
          Chapter.findByPk(payload.chapterId, { transaction: t })
        ]);
        if (!s) throw new Error(`(row ${i}) Subject không tồn tại`);
        if (!c) throw new Error(`(row ${i}) Chapter không tồn tại`);

        const vErr = validateQuestionPayload(payload);
        if (vErr) throw new Error(`(row ${i}) ${vErr}`);

        const q = await Question.create({
          subjectId: payload.subjectId,
          chapterId: payload.chapterId,
          type: payload.type,
          text: payload.text,
          explanation: payload.explanation,
          difficulty: payload.difficulty,
          points: payload.points,
          media: payload.media,
          tags: payload.tags
        }, { transaction: t });

        if (payload.type !== "fill_blank" && payload.options.length > 0) {
          const optionRows = payload.options.map(o => ({
            questionId: q.id,
            text: o.text,
            isCorrect: !!o.isCorrect,
            media: o.media ?? null,
            order: Number.isInteger(o.order) ? o.order : 0
          }));
          await Option.bulkCreate(optionRows, { transaction: t });
        }

        createdIds.push(q.id);
      }

      await t.commit();
      return res.status(201).json({ mode: "all-or-nothing", created: createdIds.length, createdIds });
    } catch (err) {
      await t.rollback();
      return res.status(400).json({ mode: "all-or-nothing", error: err.message });
    }
  }

  // partial: xử lý từng item, item nào lỗi thì bỏ qua, vẫn tạo các item hợp lệ
  const results = {
    mode: "partial",
    total: items.length,
    created: 0,
    createdIds: [],
    failed: 0,
    errors: [] // { index, message }
  };

  for (let i = 0; i < items.length; i++) {
    const raw = items[i] || {};
    const payload = {
      subjectId: raw.subjectId ?? defaultSubjectId,
      chapterId: raw.chapterId ?? defaultChapterId,
      type: (raw.type ?? defaultType ?? "single"),
      text: raw.text,
      explanation: raw.explanation ?? null,
      difficulty: raw.difficulty ?? 1,
      points: raw.points ?? 1,
      media: raw.media ?? null,
      tags: raw.tags ?? null,
      options: raw.options || []
    };

    // transaction nhỏ cho từng item để bảo toàn atom cho câu đó
    const tItem = await sequelize.transaction();
    try {
      if (!payload.subjectId) throw new Error("Thiếu subjectId");
      if (!payload.chapterId) throw new Error("Thiếu chapterId");

      const [s, c] = await Promise.all([
        Subject.findByPk(payload.subjectId, { transaction: tItem }),
        Chapter.findByPk(payload.chapterId, { transaction: tItem })
      ]);
      if (!s) throw new Error("Subject không tồn tại");
      if (!c) throw new Error("Chapter không tồn tại");

      const vErr = validateQuestionPayload(payload);
      if (vErr) throw new Error(vErr);

      const q = await Question.create({
        subjectId: payload.subjectId,
        chapterId: payload.chapterId,
        type: payload.type,
        text: payload.text,
        explanation: payload.explanation,
        difficulty: payload.difficulty,
        points: payload.points,
        media: payload.media,
        tags: payload.tags
      }, { transaction: tItem });

      if (payload.type !== "fill_blank" && payload.options.length > 0) {
        const optionRows = payload.options.map(o => ({
          questionId: q.id,
          text: o.text,
          isCorrect: !!o.isCorrect,
          media: o.media ?? null,
          order: Number.isInteger(o.order) ? o.order : 0
        }));
        await Option.bulkCreate(optionRows, { transaction: tItem });
      }

      await tItem.commit();
      results.created++;
      results.createdIds.push(q.id);
    } catch (err) {
      await tItem.rollback();
      results.failed++;
      results.errors.push({ index: i, message: err.message });
    }
  }

  return res.status(207).json(results); // 207 Multi-Status cho partial
};