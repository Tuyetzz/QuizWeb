// controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, AuthSession } = require("../models");
const crypto = require("crypto");

const hasStr = v => typeof v === "string" && v.trim().length > 0;

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!hasStr(name) || !hasStr(email) || !hasStr(password)) {
      return res.status(400).json({ message: "name, email, password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash });

    return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Email already registered" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!hasStr(email) || !hasStr(password)) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.unscoped().findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    if (user.status === "inactive") {
      return res.status(403).json({ message: "Account is inactive. Contact admin." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ message: "Invalid email or password" });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret not configured" });
    }

    // tạo access token (sống ngắn)
    const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });

    // tạo refresh token (random string)
    const refreshToken = crypto.randomBytes(64).toString("hex");

    // lưu refreshToken vào DB (AuthSession)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 ngày
    await AuthSession.create({
      userId: user.id,
      refreshToken,
      userAgent: req.headers["user-agent"] || null,
      ip: req.ip,
      expiresAt
    });

    user.lastLoginAt = new Date();
    user.save().catch(() => { /* ignore */ });

    return res.json({ accessToken, refreshToken });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!hasStr(refreshToken)) return res.status(400).json({ message: "Refresh token required" });

    const session = await AuthSession.findOne({ where: { refreshToken } });
    if (!session) return res.status(401).json({ message: "Invalid refresh token" });

    if (session.revokedAt || new Date() > session.expiresAt) {
      return res.status(401).json({ message: "Refresh token expired or revoked" });
    }

    const user = await User.findByPk(session.userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    const newAccessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!hasStr(refreshToken)) return res.status(400).json({ message: "Refresh token required" });

    const session = await AuthSession.findOne({ where: { refreshToken } });
    if (session) {
      session.revokedAt = new Date();
      await session.save();
    }

    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "name", "email", "role", "status", "avatarUrl", "lastLoginAt", "createdAt", "updatedAt"]
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { register, login, refresh, logout, getMe };
