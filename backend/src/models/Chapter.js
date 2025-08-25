const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Subject = require("./Subject");

const Chapter = sequelize.define("Chapter", {
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
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  createdAt: true,
  updatedAt: false,
  tableName: "chapters"
});

module.exports = Chapter;
