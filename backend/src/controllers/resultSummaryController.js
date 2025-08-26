const ResultSummary = require("../models/ResultSummary");
const Attempt = require("../models/Attempt");

// Lấy tất cả summaries
exports.getAllSummaries = async (req, res) => {
  try {
    const summaries = await ResultSummary.findAll({
      include: [{ model: Attempt, as: "attempt", attributes: ["id", "userId", "status", "score", "maxScore"] }]
    });
    res.json(summaries);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy summaries", details: err.message });
  }
};

// Lấy summary theo id
exports.getSummaryById = async (req, res) => {
  try {
    const summary = await ResultSummary.findByPk(req.params.id, {
      include: [{ model: Attempt, as: "attempt", attributes: ["id", "userId", "status", "score", "maxScore"] }]
    });
    if (!summary) return res.status(404).json({ error: "Summary không tồn tại" });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy summary", details: err.message });
  }
};

// Lấy summary theo attemptId
exports.getSummaryByAttempt = async (req, res) => {
  try {
    const summary = await ResultSummary.findOne({
      where: { attemptId: req.params.attemptId },
      include: [{ model: Attempt, as: "attempt", attributes: ["id", "userId", "status", "score", "maxScore"] }]
    });
    if (!summary) return res.status(404).json({ error: "Summary không tồn tại cho attempt này" });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy summary theo attempt", details: err.message });
  }
};

// Tạo summary mới
exports.createSummary = async (req, res) => {
  try {
    const { attemptId, correctCount, wrongCount, blankCount, rank } = req.body;
    const summary = await ResultSummary.create({ attemptId, correctCount, wrongCount, blankCount, rank });
    res.status(201).json(summary);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi tạo summary", details: err.message });
  }
};

// Cập nhật summary
exports.updateSummary = async (req, res) => {
  try {
    const { correctCount, wrongCount, blankCount, rank } = req.body;
    const summary = await ResultSummary.findByPk(req.params.id);
    if (!summary) return res.status(404).json({ error: "Summary không tồn tại" });

    await summary.update({ correctCount, wrongCount, blankCount, rank });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi cập nhật summary", details: err.message });
  }
};

// Xóa summary
exports.deleteSummary = async (req, res) => {
  try {
    const summary = await ResultSummary.findByPk(req.params.id);
    if (!summary) return res.status(404).json({ error: "Summary không tồn tại" });

    await summary.destroy();
    res.json({ message: "Xóa summary thành công" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi xóa summary", details: err.message });
  }
};

