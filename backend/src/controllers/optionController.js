const Option = require("../models/Option");
const Question = require("../models/Question");

// Lấy tất cả options theo questionId
exports.getOptionsByQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const options = await Option.findAll({
      where: { questionId },
      order: [["order", "ASC"]]
    });

    res.json(options);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy options", details: err.message });
  }
};

// Lấy 1 option theo id
exports.getOptionById = async (req, res) => {
  try {
    const option = await Option.findByPk(req.params.id);
    if (!option) {
      return res.status(404).json({ error: "Option không tồn tại" });
    }
    res.json(option);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy option", details: err.message });
  }
};

// Tạo option mới
exports.createOption = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { text, isCorrect, media, order } = req.body;

    // Check question tồn tại
    const question = await Question.findByPk(questionId);
    if (!question) {
      return res.status(400).json({ error: "Question không tồn tại" });
    }

    const option = await Option.create({
      questionId,
      text,
      isCorrect,
      media,
      order
    });

    res.status(201).json(option);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi tạo option", details: err.message });
  }
};

// Cập nhật option
exports.updateOption = async (req, res) => {
  try {
    const { text, isCorrect, media, order } = req.body;

    const option = await Option.findByPk(req.params.id);
    if (!option) {
      return res.status(404).json({ error: "Option không tồn tại" });
    }

    await option.update({ text, isCorrect, media, order });
    res.json(option);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi cập nhật option", details: err.message });
  }
};

// Xóa option
exports.deleteOption = async (req, res) => {
  try {
    const option = await Option.findByPk(req.params.id);
    if (!option) {
      return res.status(404).json({ error: "Option không tồn tại" });
    }
    await option.destroy();
    res.json({ message: "Xóa option thành công" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi xóa option", details: err.message });
  }
};
