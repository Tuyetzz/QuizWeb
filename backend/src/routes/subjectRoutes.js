const express = require("express");
const router = express.Router();
const subjectController = require("../controllers/subjectController");

// CRUD routes
router.get("/", subjectController.getAllSubjects);      // GET /subjects
router.get("/:id", subjectController.getSubjectById);  // GET /subjects/:id
router.post("/", subjectController.createSubject);     // POST /subjects
router.put("/:id", subjectController.updateSubject);   // PUT /subjects/:id
router.delete("/:id", subjectController.deleteSubject);// DELETE /subjects/:id

module.exports = router;
