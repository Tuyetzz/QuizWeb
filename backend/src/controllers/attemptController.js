// controllers/attemptController.js
const Attempt = require("../models/Attempt");
const User = require("../models/User");
const Subject = require("../models/Subject");
const Chapter = require("../models/Chapter");
const ResultSummary = require("../models/ResultSummary");
const Answer = require("../models/Answer");
const Question = require("../models/Question");
const Option = require("../models/Option");
const sequelize = require("../config/db");
const AttemptQuestion = require("../models/AttemptQuestion");

// ===== Helpers =====
const toInt = (v) => (v === undefined ? undefined : parseInt(v, 10));
const isEnum = (v, arr) => arr.includes(v);

// SAFE sortable fields
const SORTABLE = new Set(["createdAt", "startedAt", "submittedAt", "score", "maxScore"]);

// ===== GET /attempts?userId=&subjectId=&chapterId=&status=&mode=&limit=&offset=&sortBy=&sortDir=
exports.getAllAttempts = async (req, res) => {
  try {
    const {
      userId,
      subjectId,
      chapterId,
      status,
      mode,
      limit = 20,
      offset = 0,
      sortBy = "createdAt",
      sortDir = "DESC",
    } = req.query;

    const where = {};
    if (userId !== undefined) where.userId = toInt(userId);
    if (subjectId !== undefined) where.subjectId = toInt(subjectId);
    if (chapterId !== undefined) where.chapterId = toInt(chapterId);
    if (status) where.status = status;
    if (mode) where.mode = mode;

    const _limit = Math.min(Math.max(toInt(limit) || 20, 1), 100);
    const _offset = Math.max(toInt(offset) || 0, 0);
    const _sortBy = SORTABLE.has(sortBy) ? sortBy : "createdAt";
    const _sortDir = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC";

    const { rows, count } = await Attempt.findAndCountAll({
      where,
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        { model: Subject, as: "subject", attributes: ["id", "name", "slug"] },
        { model: Chapter, as: "chapter", attributes: ["id", "name", "order"] },
      ],
      order: [[_sortBy, _sortDir]],
      limit: _limit,
      offset: _offset,
    });

    res.json({
      items: rows,
      pagination: { total: count, limit: _limit, offset: _offset },
      sort: { sortBy: _sortBy, sortDir: _sortDir },
    });
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy attempts", details: err.message });
  }
};

// ===== GET /attempts/:id
exports.getAttemptById = async (req, res) => {
  try {
    const attempt = await Attempt.findByPk(req.params.id, {
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        { model: Subject, as: "subject", attributes: ["id", "name", "slug"] },
        { model: Chapter, as: "chapter", attributes: ["id", "name", "order"] },
      ],
    });
    if (!attempt) return res.status(404).json({ error: "Attempt không tồn tại" });
    res.json(attempt);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy attempt", details: err.message });
  }
};

// ===== POST /attempts  (tạo khung attempt ở trạng thái draft)
exports.createAttempt = async (req, res) => {
  try {
    let { userId, subjectId, chapterId, durationMinutes, mode, settings } = req.body;

    userId = toInt(userId);
    subjectId = subjectId !== undefined ? toInt(subjectId) : null;
    chapterId = chapterId !== undefined ? toInt(chapterId) : null;
    durationMinutes = toInt(durationMinutes);

    if (!userId || !durationMinutes) {
      return res.status(400).json({ error: "Thiếu userId hoặc durationMinutes" });
    }
    if (!isEnum(mode, ["exam", "practice"])) {
      return res.status(400).json({ error: "mode phải là 'exam' hoặc 'practice'" });
    }

    // Nếu có chapterId thì phải có subjectId và chapter thuộc subject
    if (chapterId && !subjectId) {
      return res.status(400).json({ error: "Cần subjectId khi truyền chapterId" });
    }
    if (subjectId) {
      const [s, c] = await Promise.all([
        Subject.findByPk(subjectId),
        chapterId ? Chapter.findByPk(chapterId) : Promise.resolve(null),
      ]);
      if (!s) return res.status(400).json({ error: "Subject không tồn tại" });
      if (c && c.subjectId !== subjectId) {
        return res.status(400).json({ error: "Chapter không thuộc subject đã chọn" });
      }
    }

    const attempt = await Attempt.create({
      userId,
      subjectId,
      chapterId,
      durationMinutes,
      mode,
      settings: settings ?? null,
      status: "draft",
      startedAt: null,
      submittedAt: null,
      expiresAt: null,
      score: 0,
      maxScore: 0,
    });

    res.status(201).json(attempt);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi tạo attempt", details: err.message });
  }
};

// ===== PATCH /attempts/:id  (cập nhật có kiểm soát)
exports.updateAttempt = async (req, res) => {
  try {
    const attempt = await Attempt.findByPk(req.params.id);
    if (!attempt) return res.status(404).json({ error: "Attempt không tồn tại" });

    const {
      status,
      startedAt,
      submittedAt,
      timeSpentSeconds,
      score,
      maxScore,
      settings,        // cho phép sửa nhẹ config (ví dụ practice)
      expiresAt,
    } = req.body;

    // Kiểm soát status transition cơ bản
    const allowedStatuses = ["draft", "in_progress", "submitted", "expired", "graded"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Trạng thái không hợp lệ" });
    }
    // ví dụ: không cho quay lại draft sau khi in_progress
    if (status === "draft" && attempt.status !== "draft") {
      return res.status(400).json({ error: "Không thể chuyển về draft" });
    }

    // Ràng buộc thời gian
    const patch = {};
    if (startedAt !== undefined) patch.startedAt = startedAt ? new Date(startedAt) : null;
    if (submittedAt !== undefined) patch.submittedAt = submittedAt ? new Date(submittedAt) : null;
    if (expiresAt !== undefined) patch.expiresAt = expiresAt ? new Date(expiresAt) : null;

    // Nếu chuyển sang submitted mà chưa có submittedAt thì set luôn
    if (status === "submitted" && !patch.submittedAt && !attempt.submittedAt) {
      patch.submittedAt = new Date();
    }

    // Điểm & thời gian
    if (timeSpentSeconds !== undefined) {
      const t = toInt(timeSpentSeconds);
      if (t < 0) return res.status(400).json({ error: "timeSpentSeconds phải >= 0" });
      patch.timeSpentSeconds = t;
    }
    if (score !== undefined) {
      const s = Number(score);
      if (s < 0) return res.status(400).json({ error: "score phải >= 0" });
      patch.score = s;
    }
    if (maxScore !== undefined) {
      const m = Number(maxScore);
      if (m < 0) return res.status(400).json({ error: "maxScore phải >= 0" });
      patch.maxScore = m;
    }
    if (settings !== undefined) {
      patch.settings = settings; // tuỳ ý, nhưng khuyên nên kiểm tra định dạng ở nơi gọi
    }
    if (status) patch.status = status;

    await attempt.update(patch);
    res.json(attempt);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi cập nhật attempt", details: err.message });
  }
};

// ===== DELETE /attempts/:id
exports.deleteAttempt = async (req, res) => {
  try {
    const attempt = await Attempt.findByPk(req.params.id);
    if (!attempt) return res.status(404).json({ error: "Attempt không tồn tại" });

    await attempt.destroy();
    // Nếu bạn muốn xoá Answer/ResultSummary kèm theo thì đảm bảo đã thiết lập quan hệ onDelete CASCADE ở model/associations
    return res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi xóa attempt", details: err.message });
  }
};

// ===== GET /attempts/:id/result
exports.getAttemptResult = async (req, res) => {
  try {
    const attemptId = req.params.id;

    const attempt = await Attempt.findByPk(attemptId, {
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        { model: Subject, as: "subject", attributes: ["id", "name", "slug"] },
        { model: Chapter, as: "chapter", attributes: ["id", "name", "order"] },
      ],
    });
    if (!attempt) return res.status(404).json({ error: "Attempt không tồn tại" });

    const summary = await ResultSummary.findOne({ where: { attemptId } });

    const answers = await Answer.findAll({
      where: { attemptId },
      include: [
        {
          model: Question,
          as: "question",
          attributes: ["id", "text", "explanation", "type", "points"],
          include: [
            { model: Option, as: "options", attributes: ["id", "text", "isCorrect", "order"] },
          ],
        },
      ],
      order: [["id", "ASC"]],
    });

    // (Tuỳ chọn) Nếu là practice & không reveal thì ẩn isCorrect:
    // if (attempt.mode === "practice" && !(attempt.settings?.revealAnswerOnSelect)) {
    //   for (const a of answers) {
    //     if (a.question?.options) {
    //       a.question.options = a.question.options.map(o => ({ id: o.id, text: o.text, order: o.order }));
    //     }
    //   }
    // }

    res.json({ attempt, summary, answers });
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy kết quả attempt", details: err.message });
  }
};


function shuffleInPlace(arr) {  // Fisher–Yates
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ===== Thi (EXAM): random N câu, snapshot vào Answer, trả metadata đầy đủ =====
exports.startExam = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // Ưu tiên lấy từ token nếu có
    const authUserId = req.user?.id ? toInt(req.user.id) : undefined;

    const {
      userId: _userId,
      subjectId: _subjectId,
      chapterId: _chapterId,
      durationMinutes: _durationMinutes,
      settings = {}
    } = req.body;

    const {
      questionCount: _questionCount,
      shuffleQuestions,
      shuffleOptions,
      pageSize: _pageSize,
      revealAnswerOnSelect
    } = settings;

    const userId = authUserId ?? toInt(_userId);
    const subjectId = toInt(_subjectId);
    const chapterId = toInt(_chapterId);
    const durationMinutes = toInt(_durationMinutes);
    const questionCount = toInt(_questionCount);
    const pageSize = toInt(_pageSize);

    // Validate input cơ bản
    if (!userId || !subjectId || !chapterId || !durationMinutes || !questionCount || !pageSize) {
      await t.rollback();
      return res.status(400).json({
        error:
          "Thiếu tham số bắt buộc (userId, subjectId, chapterId, durationMinutes, questionCount, pageSize)"
      });
    }
    if (durationMinutes < 1) {
      await t.rollback();
      return res.status(400).json({ error: "durationMinutes phải >= 1" });
    }
    if (questionCount < 1) {
      await t.rollback();
      return res.status(400).json({ error: "questionCount phải >= 1" });
    }
    if (pageSize < 1) {
      await t.rollback();
      return res.status(400).json({ error: "pageSize phải >= 1" });
    }

    // Tồn tại subject/chapter và chapter thuộc subject?
    const [s, c] = await Promise.all([
      Subject.findByPk(subjectId, { transaction: t }),
      Chapter.findByPk(chapterId, { transaction: t })
    ]);
    if (!s || !c) {
      await t.rollback();
      return res.status(400).json({ error: "Subject/Chapter không tồn tại" });
    }
    if (c.subjectId !== subjectId) {
      await t.rollback();
      return res.status(400).json({ error: "Chapter không thuộc subject đã chọn" });
    }

    // (Tuỳ chọn) không cho mở 2 bài thi đang in_progress cùng chapter
    // const existing = await Attempt.count({ where: { userId, subjectId, chapterId, mode: 'exam', status: 'in_progress' }, transaction: t });
    // if (existing > 0) {
    //   await t.rollback();
    //   return res.status(409).json({ error: "Bạn đang có bài thi chưa hoàn thành cho chapter này" });
    // }

    // Đếm số câu khả dụng
    const totalAvailable = await Question.count({
      where: { subjectId, chapterId },
      transaction: t
    });
    if (totalAvailable === 0) {
      await t.rollback();
      return res.status(400).json({ error: "Chapter này chưa có câu hỏi nào" });
    }

    // Chốt số lượng thực tế (clamp)
    const finalCount = Math.min(totalAvailable, questionCount);

    // Lấy danh sách câu hỏi (không trả ra FE, chỉ để snapshot)
    const questions = await Question.findAll({
      where: { subjectId, chapterId },
      order: shuffleQuestions ? sequelize.random() : [["id", "ASC"]],
      limit: finalCount,
      attributes: ["id", "points"],
      include: [{ model: Option, as: "options", attributes: ["id"] }],
      transaction: t
    });

    // (Tuỳ chọn) nếu muốn chốt thứ tự options ngay từ backend
    const optionOrders = {};
    if (shuffleOptions) {
      for (const q of questions) {
        if (Array.isArray(q.options) && q.options.length > 0) {
          shuffleInPlace(q.options);
        }
      }
    }
    for (const q of questions) {
      optionOrders[q.id] = Array.isArray(q.options) ? q.options.map(o => o.id) : [];
    }

    // Tính maxScore (mặc định 1 nếu null)
    const maxScore = questions.reduce((acc, q) => acc + (q.points ?? 1), 0);

    // Tạo attempt (mode = exam)
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

    const attempt = await Attempt.create(
      {
        userId,
        subjectId,
        chapterId,
        mode: "exam",
        durationMinutes,
        status: "in_progress",
        startedAt,
        expiresAt, // LƯU vào DB
        maxScore,
        settings: {
          // giữ các option linh hoạt
          questionCount: finalCount,
          pageSize,
          shuffleQuestions: !!shuffleQuestions,
          shuffleOptions: !!shuffleOptions,
          revealAnswerOnSelect: !!revealAnswerOnSelect,
        }
      },
      { transaction: t }
    );

    // Snapshot: tạo Answer rỗng cho từng câu
    const aqRows = questions.map((q, idx) => ({
      attemptId: attempt.id,
      questionId: q.id,
      optionOrder: optionOrders[q.id],
      pageIndex: Math.floor(idx / pageSize)
    }));
    await AttemptQuestion.bulkCreate(aqRows, { transaction: t });

    await t.commit();

    // Trả metadata để FE bám số thực tế
    const totalQuestions = finalCount;
    const totalPages = Math.max(1, Math.ceil(totalQuestions / pageSize));

    return res.status(201).json({
      id: attempt.id,
      startedAt: startedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      settings: {
        mode: "exam",
        questionCountRequested: questionCount,
        questionCountUsed: finalCount,
        pageSize,
        shuffleQuestions: !!shuffleQuestions,
        shuffleOptions: !!shuffleOptions,
        revealAnswerOnSelect: !!revealAnswerOnSelect
      },
      totals: {
        totalAvailable,
        totalQuestions,
        totalPages,
        maxScore
      }
    });
  } catch (err) {
    try { await t.rollback(); } catch {}
    console.error(err);
    return res
      .status(500)
      .json({ error: "Lỗi khi bắt đầu attempt (exam)", details: err.message });
  }
};


// ===== Luyện tập (PRACTICE) =====
exports.startPractice = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // Ưu tiên lấy user từ token nếu có
    const authUserId = req.user?.id ? toInt(req.user.id) : undefined;

    const {
      userId: _userId,
      subjectId: _subjectId,
      chapterId: _chapterId,
      durationMinutes: _durationMinutes, // optional; default 120
      range = {},
      settings = {}
    } = req.body;

    const {
      revealAnswerOnSelect = true,
      shuffleQuestions = false,
      shuffleOptions = false,
      orderBy = "id.asc" // "id.asc" | "id.desc" | "random"
    } = settings;

    const userId = authUserId ?? toInt(_userId);
    const subjectId = toInt(_subjectId);
    const chapterId = toInt(_chapterId);
    const _duration = toInt(_durationMinutes, 120);

    let offset = toInt(range.offset, 0);
    let limit  = toInt(range.limit, 20);

    // Validate cơ bản
    if (!userId || !subjectId || !chapterId) {
      await t.rollback();
      return res.status(400).json({ error: "Thiếu tham số bắt buộc (userId, subjectId, chapterId)" });
    }
    if (!Number.isFinite(_duration) || _duration < 1) {
      await t.rollback();
      return res.status(400).json({ error: "durationMinutes phải là số nguyên >= 1 (hoặc bỏ trống để dùng mặc định 120)" });
    }
    if (!Number.isFinite(offset) || offset < 0) {
      await t.rollback();
      return res.status(400).json({ error: "offset phải >= 0" });
    }
    if (!Number.isFinite(limit) || limit < 1) {
      await t.rollback();
      return res.status(400).json({ error: "limit phải >= 1" });
    }

    // Đếm và kiểm tra subject/chapter, và chapter thuộc subject
    const [s, c, totalAvailable] = await Promise.all([
      Subject.findByPk(subjectId, { transaction: t }),
      Chapter.findByPk(chapterId, { transaction: t }),
      Question.count({ where: { subjectId, chapterId }, transaction: t })
    ]);
    if (!s || !c) {
      await t.rollback();
      return res.status(400).json({ error: "Subject/Chapter không tồn tại" });
    }
    if (c.subjectId !== subjectId) {
      await t.rollback();
      return res.status(400).json({ error: "Chapter không thuộc subject đã chọn" });
    }
    if (totalAvailable === 0) {
      await t.rollback();
      return res.status(400).json({ error: "Chapter này chưa có câu hỏi nào" });
    }
    if (offset >= totalAvailable) {
      await t.rollback();
      return res.status(400).json({ error: `Offset vượt quá tổng câu hỏi (${totalAvailable})` });
    }

    // Clamp limit để không tràn
    if (offset + limit > totalAvailable) {
      limit = totalAvailable - offset;
    }

    // Lấy đoạn câu hỏi theo range
    let order;
    if (shuffleQuestions) {
      order = sequelize.random();                // ưu tiên shuffleQuestions nếu true
    } else if (orderBy === "id.desc") {
      order = [["id", "DESC"]];
    } else if (orderBy === "random") {
      order = sequelize.random();
    } else {
      order = [["id", "ASC"]];
    }

    const questions = await Question.findAll({
      where: { subjectId, chapterId },
      order,
      offset,
      limit,
      attributes: ["id", "text", "explanation", "type", "points"],
      include: [{ model: Option, as: "options", attributes: ["id", "text", "isCorrect", "order"] }],
      transaction: t
    });

    // Shuffle options nếu cần + snapshot thứ tự để giữ nhất quán
    const optionOrders = {};
    if (shuffleOptions) {
      for (const q of questions) {
        if (Array.isArray(q.options) && q.options.length > 0) {
          shuffleInPlace(q.options);
        }
      }
    }
    for (const q of questions) {
      optionOrders[q.id] = Array.isArray(q.options) ? q.options.map(o => o.id) : [];
    }

    // Tạo attempt (mode = practice)
    const startedAt = new Date();
    // (Tuỳ chọn) đặt expiresAt để đồng nhất logic với exam; có thể bỏ nếu không muốn hết giờ practice
    // const expiresAt = new Date(startedAt.getTime() + _duration * 60 * 1000);

    const attempt = await Attempt.create({
      userId,
      subjectId,
      chapterId,
      mode: "practice",
      durationMinutes: _duration,
      status: "in_progress",
      startedAt,
      // expiresAt, // bật nếu muốn enforce timeout cho practice
      settings: {
        range: { offset, limit },
        orderBy,
        shuffleQuestions: !!shuffleQuestions,
        shuffleOptions: !!shuffleOptions,
        revealAnswerOnSelect: !!revealAnswerOnSelect,
      }
    }, { transaction: t });

    // Tạo Answer rỗng cho các câu đã cấp (để lưu chọn nếu muốn)
    const answerRows = questions.map(q => ({
      attemptId: attempt.id,
      questionId: q.id,
      selectedOptionIds: []
      // Nếu đã có cột optionOrder ở Answer, có thể lưu: optionOrder: optionOrders[q.id]
    }));
    await Answer.bulkCreate(answerRows, { transaction: t });

    await t.commit();

    // Chuẩn hoá payload trả về
    const plain = questions.map(q => q.toJSON());
    if (!revealAnswerOnSelect) {
      // Ẩn isCorrect nếu không muốn lộ đáp án ngay
      for (const q of plain) {
        if (Array.isArray(q.options)) {
          q.options = q.options.map(o => ({ id: o.id, text: o.text, order: o.order }));
        }
      }
    }

    return res.status(201).json({
      id: attempt.id,
      mode: "practice",
      startedAt: startedAt.toISOString(),
      range: { offset, limit },
      totals: { totalAvailable, returned: plain.length },
      settings: {
        revealAnswerOnSelect: !!revealAnswerOnSelect,
        shuffleQuestions: !!shuffleQuestions,
        shuffleOptions: !!shuffleOptions,
        orderBy
      },
      items: plain
    });
  } catch (err) {
    try { await t.rollback(); } catch {}
    console.error(err);
    return res.status(500).json({ error: "Lỗi khi bắt đầu practice", details: err.message });
  }
};
