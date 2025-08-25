const express = require("express");
const router = express.Router();
const answerController = require("../controllers/answerController");

// CRUD answer
router.get("/attempt/:attemptId", answerController.getAnswersByAttempt); // GET /answers/attempt/1
router.get("/:id", answerController.getAnswerById);                      // GET /answers/5
router.post("/:attemptId/question/:questionId", answerController.createAnswer); // POST /answers/1/question/2
router.put("/:id", answerController.updateAnswer);                       // PUT /answers/5
router.delete("/:id", answerController.deleteAnswer);                    // DELETE /answers/5
router.post("/submit", answerController.submitAnswers); //submit nhiều answers
module.exports = router;
