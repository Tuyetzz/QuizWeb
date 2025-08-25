const Subject = require("../models/Subject");

// Lấy tất cả subject
exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.findAll({ order: [["order", "ASC"]] });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy danh sách subject" });
  }
};

// Lấy subject theo id
exports.getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: "Subject không tồn tại" });
    }
    res.json(subject);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy subject" });
  }
};

// Tạo subject mới
exports.createSubject = async (req, res) => {
  try {
    const { name, slug, order } = req.body;
    const subject = await Subject.create({ name, slug, order });
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi tạo subject", details: err.message });
  }
};

// Cập nhật subject
exports.updateSubject = async (req, res) => {
  try {
    const { name, slug, order } = req.body;
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: "Subject không tồn tại" });
    }
    await subject.update({ name, slug, order });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi cập nhật subject", details: err.message });
  }
};

// Xóa subject
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: "Subject không tồn tại" });
    }
    await subject.destroy();
    res.json({ message: "Xóa subject thành công" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi xóa subject" });
  }
};
