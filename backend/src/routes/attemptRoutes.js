const express = require("express");
const router = express.Router();
const attemptController = require("../controllers/attemptController");

// CRUD
router.get("/", attemptController.getAllAttempts);       // GET /attempts?userId=1&status=submitted
router.get("/:id", attemptController.getAttemptById);   // GET /attempts/:id
router.post("/", attemptController.createAttempt);      // POST /attempts
router.put("/:id", attemptController.updateAttempt);    // PUT /attempts/:id
router.delete("/:id", attemptController.deleteAttempt); // DELETE /attempts/:id
router.get("/:id/result", attemptController.getAttemptResult);  //GET /attempts/1/result

module.exports = router;
