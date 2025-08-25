// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  if (!process.env.JWT_SECRET) {
    // tránh verify với secret undefined
    return res.status(500).json({ message: "JWT secret not configured" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      const isExpired = err.name === "TokenExpiredError";
      return res.status(401).json({ message: isExpired ? "Token expired" : "Invalid token" });
    }
    // decoded: { id, role, iat, exp }
    req.user = { id: decoded.id, role: decoded.role };
    next();
  });
};

module.exports = authMiddleware;

// (tuỳ chọn) guard theo role
module.exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
