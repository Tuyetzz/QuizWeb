const AttemptQuestion = require("../models/AttemptQuestion");
const Attempt = require("../models/Attempt");
const Question = require("../models/Question");

// Lấy tất cả AttemptQuestion theo attemptId
exports.getAttemptQuestions = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const list = await AttemptQuestion.findAll({
      where: { attemptId },
      include: [{ model: Question, as: "question" }]
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy attemptQuestions", details: err.message });
  }
};

// Thêm question vào attempt
exports.addAttemptQuestion = async (req, res) => {
  try {
    const { attemptId, questionId, optionOrder, pageIndex } = req.body;

    // check attempt + question tồn tại
    const attempt = await Attempt.findByPk(attemptId);
    if (!attempt) return res.status(400).json({ error: "Attempt không tồn tại" });

    const question = await Question.findByPk(questionId);
    if (!question) return res.status(400).json({ error: "Question không tồn tại" });

    const aq = await AttemptQuestion.create({ attemptId, questionId, optionOrder, pageIndex });
    res.status(201).json(aq);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi tạo attemptQuestion", details: err.message });
  }
};

// Cập nhật AttemptQuestion (ví dụ: pageIndex, optionOrder)
exports.updateAttemptQuestion = async (req, res) => {
  try {
    const { optionOrder, pageIndex } = req.body;
    const aq = await AttemptQuestion.findByPk(req.params.id);
    if (!aq) return res.status(404).json({ error: "AttemptQuestion không tồn tại" });

    await aq.update({ optionOrder, pageIndex });
    res.json(aq);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi cập nhật attemptQuestion", details: err.message });
  }
};

// Xóa AttemptQuestion
exports.deleteAttemptQuestion = async (req, res) => {
  try {
    const aq = await AttemptQuestion.findByPk(req.params.id);
    if (!aq) return res.status(404).json({ error: "AttemptQuestion không tồn tại" });

    await aq.destroy();
    res.json({ message: "Xóa attemptQuestion thành công" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi xóa attemptQuestion", details: err.message });
  }
};
