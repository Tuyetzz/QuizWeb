const Question = require("../models/Question");
const Subject = require("../models/Subject");
const Chapter = require("../models/Chapter");

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
