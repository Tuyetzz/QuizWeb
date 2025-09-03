  // models/Attempt.js
  const { DataTypes } = require("sequelize");
  const sequelize = require("../config/db");
  const User = require("./User");
  const Subject = require("./Subject");
  const Chapter = require("./Chapter");

  const Attempt = sequelize.define(
    "Attempt",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: "id" },
        onDelete: "CASCADE",
      },
      subjectId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: Subject, key: "id" },
        onDelete: "SET NULL",
      },
      chapterId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: Chapter, key: "id" },
        onDelete: "SET NULL",
      },

      // WHAT
      mode: {
        type: DataTypes.ENUM("exam", "practice"),
        allowNull: false,
        defaultValue: "practice",
      },
      status: {
        type: DataTypes.ENUM("draft", "in_progress", "submitted", "expired", "graded"),
        defaultValue: "draft",
      },

      // WHEN
      startedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      submittedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Thời điểm tự động hết hạn (đặc biệt cho exam)",
      },

      // TIME & SCORING
      durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
      },
      timeSpentSeconds: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { min: 0 },
      },
      score: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        validate: { min: 0 },
      },
      maxScore: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        validate: { min: 0 },
      },

      // FLEX OPTIONS
      settings: {
        // exam: { questionCount, pageSize, shuffleQuestions, shuffleOptions, revealAnswerOnSelect, ... }
        // practice: { range, orderBy, shuffleOptions, revealAnswerOnSelect, ... }
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: "attempts",
      indexes: [
        { fields: ["userId"] },
        { fields: ["mode"] },
        { fields: ["status"] },
        { fields: ["startedAt"] },
        { fields: ["subjectId", "chapterId"] },
        // Truy vấn phổ biến: "tất cả exam đang in_progress của user"
        { fields: ["userId", "mode", "status"] },
      ],
      validate: {
        // Nếu có expiresAt thì phải sau startedAt
        expiresAfterStart() {
          if (this.expiresAt && this.startedAt && this.expiresAt <= this.startedAt) {
            throw new Error("expiresAt phải lớn hơn startedAt");
          }
        },
      },
    }
  );

  module.exports = Attempt;
