const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Attempt = require("./Attempt");
const Question = require("./Question");

const Answer = sequelize.define("Answer", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  attemptId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Attempt,
      key: "id"
    },
    onDelete: "CASCADE"
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Question,
      key: "id"
    },
    onDelete: "CASCADE"
  },
  selectedOptionIds: {
    type: DataTypes.JSON, // array các option id
    allowNull: true
  },
  value: {
    type: DataTypes.TEXT, // nếu là fill_blank thì lưu text
    allowNull: true
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  earnedPoints: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  answeredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  flagged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: "answers"
});

module.exports = Answer;
