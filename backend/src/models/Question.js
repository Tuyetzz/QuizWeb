const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Subject = require("./Subject");
const Chapter = require("./Chapter");

const Question = sequelize.define("Question", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Subject,
      key: "id"
    },
    onDelete: "CASCADE"
  },
  chapterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Chapter,
      key: "id"
    },
    onDelete: "CASCADE"
  },
  type: {
    type: DataTypes.ENUM("single", "multiple", "true_false", "fill_blank"),
    allowNull: false
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  difficulty: {
    type: DataTypes.INTEGER, // 1 = dễ, 2 = trung bình, 3 = khó
    defaultValue: 1
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  media: {
    type: DataTypes.JSON, // lưu array link ảnh/video
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON, // lưu array tag (["algebra","geometry"])
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: "questions"
});

module.exports = Question;
