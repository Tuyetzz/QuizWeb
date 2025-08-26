const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Attempt = require("./Attempt");

const ResultSummary = sequelize.define("ResultSummary", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  attemptId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: Attempt,
      key: "id"
    },
    onDelete: "CASCADE"
  },
  correctCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  wrongCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  blankCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  rank: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: "result_summaries"
});

module.exports = ResultSummary;
