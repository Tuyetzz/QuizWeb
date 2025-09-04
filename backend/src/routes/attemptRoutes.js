const express = require("express");
const router = express.Router();
const attemptController = require("../controllers/attemptController");

// CRUD
router.get("/", attemptController.getAllAttempts);       // GET /attempts?userId=1&status=submitted
router.get("/:id", attemptController.getAttemptById);   // GET /attempts/:id
router.post("/", attemptController.createAttempt);      // POST /attempts
router.patch("/:id", attemptController.updateAttempt);    // PATCH /attempts/:id
router.delete("/:id", attemptController.deleteAttempt); // DELETE /attempts/:id
router.get("/:id/result", attemptController.getAttemptResult);  //GET /attempts/1/result

// Start Exam / Practice
router.post("/start", attemptController.startExam);       // POST /attempts/start
router.post("/practice", attemptController.startPractice); // POST /attempts/practice

//submit
router.post("/:id/submit", attemptController.submitAttempt); // POST /attempts/:id/submit

module.exports = router;
