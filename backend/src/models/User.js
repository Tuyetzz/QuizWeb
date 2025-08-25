// models/User.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM("student", "teacher", "admin"), defaultValue: "student" },
  status: { type: DataTypes.ENUM("active", "inactive"), defaultValue: "active" },
  avatarUrl: { type: DataTypes.STRING, allowNull: true },
  lastLoginAt: { type: DataTypes.DATE, allowNull: true }
}, {
  timestamps: true,
  tableName: "users",
  defaultScope: { attributes: { exclude: ["passwordHash"] } },   // don’t leak by default
  indexes: [{ unique: true, fields: ["email"] }],
  hooks: {
    beforeValidate: (user) => { if (user.email) user.email = user.email.trim().toLowerCase(); }
  }
});

module.exports = User;
