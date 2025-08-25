const express = require("express");
const router = express.Router();
const chapterController = require("../controllers/chapterController");

// CRUD
router.get("/", chapterController.getAllChapters);      // GET /chapters?subjectId=1
router.get("/:id", chapterController.getChapterById);  // GET /chapters/:id
router.post("/", chapterController.createChapter);     // POST /chapters
router.put("/:id", chapterController.updateChapter);   // PUT /chapters/:id
router.delete("/:id", chapterController.deleteChapter);// DELETE /chapters/:id

module.exports = router;
