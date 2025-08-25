const Chapter = require("../models/Chapter");
const Subject = require("../models/Subject");

// Lấy tất cả chapter (có thể filter theo subjectId)
exports.getAllChapters = async (req, res) => {
  try {
    const { subjectId } = req.query; // optional ?subjectId=1
    const where = subjectId ? { subjectId } : {};

    const chapters = await Chapter.findAll({
      where,
      include: [{ model: Subject, attributes: ["id", "name", "slug"] }],
      order: [["order", "ASC"]]
    });
    res.json(chapters);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy chapters", details: err.message });
  }
};

// Lấy 1 chapter theo id
exports.getChapterById = async (req, res) => {
  try {
    const chapter = await Chapter.findByPk(req.params.id, {
      include: [{ model: Subject, attributes: ["id", "name", "slug"] }]
    });
    if (!chapter) {
      return res.status(404).json({ error: "Chapter không tồn tại" });
    }
    res.json(chapter);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy chapter", details: err.message });
  }
};

// Tạo chapter mới
exports.createChapter = async (req, res) => {
  try {
    const { subjectId, name, order } = req.body;

    // check subject tồn tại chưa
    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(400).json({ error: "Subject không tồn tại" });
    }

    const chapter = await Chapter.create({ subjectId, name, order });
    res.status(201).json(chapter);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi tạo chapter", details: err.message });
  }
};

// Cập nhật chapter
exports.updateChapter = async (req, res) => {
  try {
    const { subjectId, name, order } = req.body;

    const chapter = await Chapter.findByPk(req.params.id);
    if (!chapter) {
      return res.status(404).json({ error: "Chapter không tồn tại" });
    }

    if (subjectId) {
      const subject = await Subject.findByPk(subjectId);
      if (!subject) {
        return res.status(400).json({ error: "Subject không tồn tại" });
      }
    }

    await chapter.update({ subjectId, name, order });
    res.json(chapter);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi cập nhật chapter", details: err.message });
  }
};

// Xóa chapter
exports.deleteChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findByPk(req.params.id);
    if (!chapter) {
      return res.status(404).json({ error: "Chapter không tồn tại" });
    }
    await chapter.destroy();
    res.json({ message: "Xóa chapter thành công" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi xóa chapter", details: err.message });
  }
};
