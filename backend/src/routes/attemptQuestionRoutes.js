const express = require("express");
const router = express.Router();
const aqController = require("../controllers/attemptQuestionController");

// CRUD
router.get("/attempt/:attemptId", aqController.getAttemptQuestions); // GET /api/attempt-questions/attempt/1
router.post("/", aqController.addAttemptQuestion);                   // POST /api/attempt-questions
router.put("/:id", aqController.updateAttemptQuestion);              // PUT /api/attempt-questions/5
router.delete("/:id", aqController.deleteAttemptQuestion);           // DELETE /api/attempt-questions/5

module.exports = router;
