const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Question = require("./Question");

const Option = sequelize.define("Option", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
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
  text: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  media: {
    type: DataTypes.STRING,
    allowNull: true
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  tableName: "options"
});

module.exports = Option;
