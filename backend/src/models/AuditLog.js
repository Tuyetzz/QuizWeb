const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const AuditLog = sequelize.define("AuditLog", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  actorUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: "id"
    },
    onDelete: "SET NULL"
  },
  action: {
    type: DataTypes.STRING, // ví dụ: "question.create", "attempt.submit"
    allowNull: false
  },
  entityType: {
    type: DataTypes.STRING, // ví dụ: "Question", "Attempt"
    allowNull: false
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  payload: {
    type: DataTypes.JSON, // log dữ liệu (old/new, params...)
    allowNull: true
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true, // sẽ có createdAt
  updatedAt: false, // log không cần updatedAt
  tableName: "audit_logs"
});

module.exports = AuditLog;
