// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const usersController = require("../controllers/userController");
const auth = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/authMiddleware");

// Chỉ admin được list/create/delete; getOne thì admin hoặc chính chủ
router.get("/", auth, requireRole("admin"), usersController.list);
router.post("/", auth, requireRole("admin"), usersController.create);
router.get("/:id", auth, usersController.getOne);
router.patch("/:id", auth, usersController.update);
router.delete("/:id", auth, requireRole("admin"), usersController.remove);

module.exports = router;
