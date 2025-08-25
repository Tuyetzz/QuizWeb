const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Attempt = require("./Attempt");
const Question = require("./Question");

const AttemptQuestion = sequelize.define("AttemptQuestion", {
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
  optionOrder: {
    type: DataTypes.JSON, // giữ thứ tự option đã shuffle
    allowNull: true
  },
  pageIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: false,
  tableName: "attempt_questions"
});

module.exports = AttemptQuestion;
