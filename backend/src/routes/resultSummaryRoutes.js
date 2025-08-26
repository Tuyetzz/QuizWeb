const express = require("express");
const router = express.Router();
const resultSummaryController = require("../controllers/resultSummaryController");

// CRUD
router.get("/", resultSummaryController.getAllSummaries);          // GET /api/result-summaries
router.get("/:id", resultSummaryController.getSummaryById);       // GET /api/result-summaries/1
router.get("/attempt/:attemptId", resultSummaryController.getSummaryByAttempt); // GET /api/result-summaries/attempt/1
router.post("/", resultSummaryController.createSummary);          // POST /api/result-summaries
router.put("/:id", resultSummaryController.updateSummary);        // PUT /api/result-summaries/1
router.delete("/:id", resultSummaryController.deleteSummary);     // DELETE /api/result-summaries/1

module.exports = router;
