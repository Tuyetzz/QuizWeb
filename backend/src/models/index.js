// models/index.js
const sequelize = require("../config/db");

const User = require("./User");
const Subject = require("./Subject");
const Chapter = require("./Chapter");
const Question = require("./Question");
const Option = require("./Option");
const AuthSession = require("./AuthSession");
const AuditLog = require("./AuditLog");
const Attempt = require("./Attempt");
const AttemptQuestion = require("./AttemptQuestion");
const Answer = require("./Answer");
const ResultSummary = require("./ResultSummary");

// Subject – Chapter – Question
Subject.hasMany(Chapter, { foreignKey: "subjectId", as: "chapters", onDelete: "CASCADE" });
Chapter.belongsTo(Subject, { foreignKey: "subjectId", as: "subject" });

Chapter.hasMany(Question, { foreignKey: "chapterId", as: "questions", onDelete: "CASCADE" });
Question.belongsTo(Chapter, { foreignKey: "chapterId", as: "chapter" });

// (Giữ nếu bạn cần link trực tiếp Subject–Question)
Subject.hasMany(Question, { foreignKey: "subjectId", as: "questions", onDelete: "SET NULL" });
Question.belongsTo(Subject, { foreignKey: "subjectId", as: "subject" });

// Question – Option
Question.hasMany(Option, { foreignKey: "questionId", as: "options", onDelete: "CASCADE" });
Option.belongsTo(Question, { foreignKey: "questionId", as: "question" });

// User – AuthSession
User.hasMany(AuthSession, { foreignKey: "userId", as: "sessions", onDelete: "CASCADE" });
AuthSession.belongsTo(User, { foreignKey: "userId", as: "user" });

// User – Attempt
User.hasMany(Attempt, { foreignKey: "userId", as: "attempts", onDelete: "CASCADE" });
Attempt.belongsTo(User, { foreignKey: "userId", as: "user" });

// Subject/Chapter – Attempt
Subject.hasMany(Attempt, { foreignKey: "subjectId", as: "attempts", onDelete: "SET NULL" });
Attempt.belongsTo(Subject, { foreignKey: "subjectId", as: "subject" });

Chapter.hasMany(Attempt, { foreignKey: "chapterId", as: "attempts", onDelete: "SET NULL" });
Attempt.belongsTo(Chapter, { foreignKey: "chapterId", as: "chapter" });

// AuditLog – User (actor)
User.hasMany(AuditLog, { foreignKey: "actorUserId", as: "auditLogs", onDelete: "SET NULL" });
AuditLog.belongsTo(User, { foreignKey: "actorUserId", as: "actor" });

// Attempt – AttemptQuestion
Attempt.hasMany(AttemptQuestion, { foreignKey: "attemptId", as: "attemptQuestions", onDelete: "CASCADE" });
AttemptQuestion.belongsTo(Attempt, { foreignKey: "attemptId", as: "attempt" });

// (BỔ SUNG) AttemptQuestion – Question (để load chi tiết câu hỏi trong attempt)
Question.hasMany(AttemptQuestion, { foreignKey: "questionId", as: "attemptQuestions", onDelete: "CASCADE" });
AttemptQuestion.belongsTo(Question, { foreignKey: "questionId", as: "question" });

// Attempt – Answer
Attempt.hasMany(Answer, { foreignKey: "attemptId", as: "answers", onDelete: "CASCADE" });
Answer.belongsTo(Attempt, { foreignKey: "attemptId", as: "attempt" });

// (BỔ SUNG) Answer – Question & Option (để check đúng/sai nhanh)
Question.hasMany(Answer, { foreignKey: "questionId", as: "answers", onDelete: "CASCADE" });
Answer.belongsTo(Question, { foreignKey: "questionId", as: "question" });

Option.hasMany(Answer, { foreignKey: "optionId", as: "answers", onDelete: "SET NULL" });
Answer.belongsTo(Option, { foreignKey: "optionId", as: "option" });

// Attempt – ResultSummary (1–1)
Attempt.hasOne(ResultSummary, { foreignKey: "attemptId", as: "resultSummary", onDelete: "CASCADE" });
ResultSummary.belongsTo(Attempt, { foreignKey: "attemptId", as: "attempt" });

module.exports = {
  sequelize,
  User,
  Subject,
  Chapter,
  Question,
  Option,
  AuthSession,
  Attempt,
  AuditLog,
  AttemptQuestion,
  Answer,
  ResultSummary
};
