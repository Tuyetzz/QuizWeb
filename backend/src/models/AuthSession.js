const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const AuthSession = sequelize.define("AuthSession", {
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
  refreshToken: {
    type: DataTypes.STRING,
    allowNull: false
    // ⚠️ Thực tế: nên lưu HASH của refreshToken, không lưu raw
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  revokedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: "auth_sessions"
});

module.exports = AuthSession;
