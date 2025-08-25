// controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

// simple minimal validation without bringing in a lib yet
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

    // defaultScope already hides passwordHash
    return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status });
  } catch (err) {
    // handle unique constraint race conditions
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

    const user = await User.unscoped().findOne({ where: { email: email.trim().toLowerCase() } }); // need passwordHash
    // generic error to avoid user enumeration
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    if (user.status === "inactive") {
      return res.status(403).json({ message: "Account is inactive. Contact admin." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ message: "Invalid email or password" });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret not configured" });
    }

    const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // update last login asynchronously (don’t block response)
    user.lastLoginAt = new Date();
    user.save().catch(() => { /* noop */ });

    // you can also set httpOnly cookie if you prefer cookies over Authorization header
    // res.cookie("token", accessToken, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 3600_000 });

    return res.json({ accessToken });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getMe = async (req, res) => {
  try {
    // req.user will come from auth middleware (below)
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "name", "email", "role", "status", "avatarUrl", "lastLoginAt", "createdAt", "updatedAt"]
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { register, login, getMe };
