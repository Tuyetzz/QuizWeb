// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/authController");
const auth = require("../middlewares/authMiddleware");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/me", auth, userController.getMe);

module.exports = router;
