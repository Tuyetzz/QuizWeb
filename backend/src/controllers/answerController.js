const Answer = require("../models/Answer");
const Attempt = require("../models/Attempt");
const Question = require("../models/Question");
const ResultSummary = require("../models/ResultSummary");
const Option = require("../models/Option");


// Lấy tất cả answer theo attemptId
exports.getAnswersByAttempt = async (req, res) => {
  try {
    const attemptId = req.params.attemptId;

    const answers = await Answer.findAll({
      where: { attemptId },
      include: [
        {
          model: Question,
          as: "question",
          include: [{ model: Option, as: "options" }]
        }
      ]
    });

    res.json(answers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi khi lấy answers", details: err.message });
  }
};

// Lấy 1 answer theo id
exports.getAnswerById = async (req, res) => {
  try {
    const answer = await Answer.findByPk(req.params.id);
    if (!answer) return res.status(404).json({ error: "Answer không tồn tại" });
    res.json(answer);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy answer", details: err.message });
  }
};

// Tạo answer mới
exports.createAnswer = async (req, res) => {
  try {
    const { attemptId, questionId } = req.params;
    const { selectedOptionIds, value, isCorrect, earnedPoints, answeredAt, flagged } = req.body;

    // check attempt tồn tại
    const attempt = await Attempt.findByPk(attemptId);
    if (!attempt) return res.status(400).json({ error: "Attempt không tồn tại" });

    // check question tồn tại
    const question = await Question.findByPk(questionId);
    if (!question) return res.status(400).json({ error: "Question không tồn tại" });

    const answer = await Answer.create({
      attemptId,
      questionId,
      selectedOptionIds,
      value,
      isCorrect,
      earnedPoints,
      answeredAt,
      flagged
    });

    res.status(201).json(answer);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi tạo answer", details: err.message });
  }
};

// Cập nhật answer
exports.updateAnswer = async (req, res) => {
  try {
    const { selectedOptionIds, value, isCorrect, earnedPoints, answeredAt, flagged } = req.body;

    const answer = await Answer.findByPk(req.params.id);
    if (!answer) return res.status(404).json({ error: "Answer không tồn tại" });

    await answer.update({ selectedOptionIds, value, isCorrect, earnedPoints, answeredAt, flagged });
    res.json(answer);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi cập nhật answer", details: err.message });
  }
};

// Xóa answer
exports.deleteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findByPk(req.params.id);
    if (!answer) return res.status(404).json({ error: "Answer không tồn tại" });

    await answer.destroy();
    res.json({ message: "Xóa answer thành công" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi xóa answer", details: err.message });
  }
};

// Submit nhiều answers 1 lần (bulk insert/update)
exports.submitAnswers = async (req, res) => {
  try {
    const { attemptId, answers } = req.body;

    const attempt = await Attempt.findByPk(attemptId);
    if (!attempt) return res.status(400).json({ error: "Attempt không tồn tại" });

    let results = [];
    let totalScore = 0;
    let totalMaxScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let blankCount = 0;

    for (const ans of answers) {
      const { questionId, selectedOptionIds, value, isCorrect, earnedPoints } = ans;

      const question = await Question.findByPk(questionId);
      if (!question) continue;

      totalMaxScore += question.points || 1;
      if (earnedPoints) totalScore += earnedPoints;

      // update counts
      if (isCorrect === true) correctCount++;
      else if (isCorrect === false) wrongCount++;
      else blankCount++;

      let answer = await Answer.findOne({ where: { attemptId, questionId } });
      if (answer) {
        await answer.update({
          selectedOptionIds,
          value,
          isCorrect,
          earnedPoints,
          answeredAt: new Date()
        });
      } else {
        answer = await Answer.create({
          attemptId,
          questionId,
          selectedOptionIds,
          value,
          isCorrect,
          earnedPoints,
          answeredAt: new Date()
        });
      }

      results.push(answer);
    }

    // cập nhật attempt
    await attempt.update({
      status: "submitted",
      submittedAt: new Date(),
      score: totalScore,
      maxScore: totalMaxScore
    });

    // cập nhật hoặc tạo ResultSummary
    let summary = await ResultSummary.findOne({ where: { attemptId } });
    if (summary) {
      await summary.update({ correctCount, wrongCount, blankCount });
    } else {
      summary = await ResultSummary.create({ attemptId, correctCount, wrongCount, blankCount });
    }

    res.json({
      message: "Nộp bài thành công",
      attempt: {
        id: attempt.id,
        score: totalScore,
        maxScore: totalMaxScore,
        status: attempt.status
      },
      summary,
      answers: results
    });
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi submit answers", details: err.message });
  }
};
