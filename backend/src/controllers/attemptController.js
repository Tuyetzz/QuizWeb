const Attempt = require("../models/Attempt");
const User = require("../models/User");
const Subject = require("../models/Subject");
const Chapter = require("../models/Chapter");
const ResultSummary = require("../models/ResultSummary");
const Answer = require("../models/Answer");
const Question = require("../models/Question");
const Option = require("../models/Option");
const sequelize = require("../config/db");


// Lấy tất cả attempts (có thể filter theo userId, subjectId, chapterId, status)
exports.getAllAttempts = async (req, res) => {
  try {
    const { userId, subjectId, chapterId, status } = req.query;
    const where = {};
    if (userId) where.userId = userId;
    if (subjectId) where.subjectId = subjectId;
    if (chapterId) where.chapterId = chapterId;
    if (status) where.status = status;

    const attempts = await Attempt.findAll({
      where,
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        { model: Subject, as: "subject", attributes: ["id", "name", "slug"] },
        { model: Chapter, as: "chapter", attributes: ["id", "name", "order"] }
      ],
      order: [["createdAt", "DESC"]]
    });
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy attempts", details: err.message });
  }
};

// Lấy 1 attempt
exports.getAttemptById = async (req, res) => {
  try {
    const attempt = await Attempt.findByPk(req.params.id, {
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        { model: Subject, as: "subject", attributes: ["id", "name", "slug"] },
        { model: Chapter, as: "chapter", attributes: ["id", "name", "order"] }
      ]
    });
    if (!attempt) return res.status(404).json({ error: "Attempt không tồn tại" });
    res.json(attempt);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy attempt", details: err.message });
  }
};

// Tạo attempt mới
exports.createAttempt = async (req, res) => {
  try {
    const { userId, subjectId, chapterId, durationMinutes, settings } = req.body;

    const attempt = await Attempt.create({
      userId,
      subjectId,
      chapterId,
      durationMinutes,
      settings,
      status: "draft"
    });

    res.status(201).json(attempt);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi tạo attempt", details: err.message });
  }
};

// Cập nhật attempt (ví dụ: cập nhật trạng thái, điểm số, thời gian spent)
exports.updateAttempt = async (req, res) => {
  try {
    const { status, startedAt, submittedAt, timeSpentSeconds, score, maxScore } = req.body;

    const attempt = await Attempt.findByPk(req.params.id);
    if (!attempt) return res.status(404).json({ error: "Attempt không tồn tại" });

    await attempt.update({ status, startedAt, submittedAt, timeSpentSeconds, score, maxScore });
    res.json(attempt);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi cập nhật attempt", details: err.message });
  }
};

// Xóa attempt
exports.deleteAttempt = async (req, res) => {
  try {
    const attempt = await Attempt.findByPk(req.params.id);
    if (!attempt) return res.status(404).json({ error: "Attempt không tồn tại" });

    await attempt.destroy();
    res.json({ message: "Xóa attempt thành công" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi xóa attempt", details: err.message });
  }
};

// Lấy kết quả chi tiết của 1 attempt
exports.getAttemptResult = async (req, res) => {
  try {
    const attemptId = req.params.id;

    const attempt = await Attempt.findByPk(attemptId, {
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        { model: Subject, as: "subject", attributes: ["id", "name", "slug"] },
        { model: Chapter, as: "chapter", attributes: ["id", "name", "order"] }
      ]
    });
    if (!attempt) return res.status(404).json({ error: "Attempt không tồn tại" });

    // lấy summary
    const summary = await ResultSummary.findOne({ where: { attemptId } });

    // lấy answers kèm question + options
    const answers = await Answer.findAll({
      where: { attemptId },
      include: [
        {
          model: Question,
          as: "question",
          include: [{ model: Option, as: "options", attributes: ["id", "text", "isCorrect", "order"] }]
        }
      ]
    });

    res.json({
      attempt,
      summary,
      answers
    });
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy kết quả attempt", details: err.message });
  }
};

// Bắt đầu attempt: random câu hỏi và lưu vào DB
exports.startAttempt = async (req, res) => {
  try {
    const { userId, subjectId, chapterId, durationMinutes, settings } = req.body;
    const { questionCount, shuffleQuestions, shuffleOptions, pageSize, revealAnswerOnSelect } = settings;

    // Đếm tổng số câu hỏi khả dụng
    const totalAvailable = await Question.count({
      where: { subjectId, chapterId }
    });

    if (totalAvailable === 0) {
      return res.status(400).json({ error: "Chapter này chưa có câu hỏi nào" });
    }

    // Nếu yêu cầu nhiều hơn thì giảm xuống
    const finalCount = Math.min(totalAvailable, questionCount);

    // Query danh sách câu hỏi
    const questions = await Question.findAll({
      where: { subjectId, chapterId },
      order: shuffleQuestions ? sequelize.random() : [["id", "ASC"]],
      limit: finalCount,
      include: [{ model: Option, as: "options" }]
    });

    // Nếu shuffleOptions thì xáo trộn mảng options bằng JS
    if (shuffleOptions) {
      for (const q of questions) {
        if (q.options) {
          q.options = q.options.sort(() => Math.random() - 0.5);
        }
      }
    }

    // Tạo attempt
    const attempt = await Attempt.create({
      userId,
      subjectId,
      chapterId,
      durationMinutes,
      settings: { questionCount: finalCount, shuffleQuestions, shuffleOptions, pageSize, revealAnswerOnSelect },
      status: "in_progress",
      startedAt: new Date()
    });

    // Gắn câu hỏi vào bảng Answer (mỗi Answer ban đầu rỗng)
    for (const q of questions) {
      await Answer.create({
        attemptId: attempt.id,
        questionId: q.id,
        selectedOptionIds: []
      });
    }

    res.status(201).json({ id: attempt.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi khi bắt đầu attempt", details: err.message });
  }
};
