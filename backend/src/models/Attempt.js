const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");
const Subject = require("./Subject");
const Chapter = require("./Chapter");

const Attempt = sequelize.define("Attempt", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: "id"
    },
    onDelete: "CASCADE"
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Subject,
      key: "id"
    }
  },
  chapterId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Chapter,
      key: "id"
    }
  },
  status: {
    type: DataTypes.ENUM("draft", "in_progress", "submitted", "expired", "graded"),
    defaultValue: "draft"
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  timeSpentSeconds: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  settings: {
    type: DataTypes.JSON, // {questionCount, pageSize, shuffleQuestions, shuffleOptions, revealAnswerOnSelect}
    allowNull: true
  },
  score: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  maxScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  }
}, {
  timestamps: true,
  tableName: "attempts"
});

module.exports = Attempt;
