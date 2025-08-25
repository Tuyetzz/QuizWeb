const express = require("express");
const router = express.Router();
const questionController = require("../controllers/questionController");

// CRUD
router.get("/", questionController.getAllQuestions);      // GET /questions
router.get("/:id", questionController.getQuestionById);  // GET /questions/:id
router.post("/", questionController.createQuestion);     // POST /questions
router.put("/:id", questionController.updateQuestion);   // PUT /questions/:id
router.delete("/:id", questionController.deleteQuestion);// DELETE /questions/:id

module.exports = router;
