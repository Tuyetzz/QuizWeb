const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Subject = sequelize.define("Subject", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(150),
    unique: 'uq_subjects_slug',
    allowNull: false
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  createdAt: true,
  updatedAt: false, // chỉ cần createdAt
  tableName: "subjects"
});

module.exports = Subject;
