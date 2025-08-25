// controllers/usersController.js
const { Op } = require("sequelize");
const { User } = require("../models");

// GET /api/users
// ?q=keyword&role=student|teacher|admin&status=active|inactive&page=1&limit=20
exports.list = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const offset = (page - 1) * limit;
    const { q, role, status } = req.query;

    const where = {};
    if (q) where[Op.or] = [
      { name: { [Op.like]: `%${q}%` } },
      { email: { [Op.like]: `%${q.toLowerCase()}%` } }
    ];
    if (role) where.role = role;
    if (status) where.status = status;

    const { rows, count } = await User.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      offset,
      limit,
      attributes: ["id", "name", "email", "role", "status", "avatarUrl", "lastLoginAt", "createdAt"]
    });

    return res.json({
      data: rows,
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/users/:id
exports.getOne = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ["id", "name", "email", "role", "status", "avatarUrl", "lastLoginAt", "createdAt", "updatedAt"]
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/users  (admin tạo user, có thể tạo teacher/admin)
exports.create = async (req, res) => {
  try {
    const { name, email, password, role = "student", status = "active" } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: "name, email, password are required" });

    const normalizedEmail = email.trim().toLowerCase();
    const exists = await User.unscoped().findOne({ where: { email: normalizedEmail } });
    if (exists) return res.status(409).json({ message: "Email already exists" });

    const bcrypt = require("bcrypt");
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash, role, status });
    return res.status(201).json({
      id: user.id, name: user.name, email: user.email, role: user.role, status: user.status
    });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Email already exists" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/users/:id  (admin cập nhật role/status; tên/avatar chung)
exports.update = async (req, res) => {
  try {
    const { name, avatarUrl, role, status, email } = req.body || {};
    if (email) return res.status(400).json({ message: "Email change not allowed here" });

    const user = await User.unscoped().findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // nếu không phải admin, chỉ cho sửa name/avatar của chính mình (đặt rule ở route cũng được)
    if (req.user.role !== "admin" && req.user.id !== user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (name !== undefined) user.name = String(name).trim();
    if (avatarUrl !== undefined) user.avatarUrl = String(avatarUrl).trim();

    // chỉ admin mới sửa role/status
    if (req.user.role === "admin") {
      if (role) user.role = role;
      if (status) user.status = status;
    }

    await user.save();
    const safe = await User.findByPk(user.id, {
      attributes: ["id", "name", "email", "role", "status", "avatarUrl", "lastLoginAt", "createdAt", "updatedAt"]
    });
    return res.json(safe);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/users/:id  (admin)
exports.remove = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.destroy();
    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};
