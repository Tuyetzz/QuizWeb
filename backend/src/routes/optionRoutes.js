const express = require("express");
const router = express.Router();
const optionController = require("../controllers/optionController");

// CRUD options theo questionId
router.get("/question/:questionId", optionController.getOptionsByQuestion); // GET /options/question/1
router.get("/:id", optionController.getOptionById);                        // GET /options/5
router.post("/question/:questionId", optionController.createOption);       // POST /options/question/1
router.put("/:id", optionController.updateOption);                         // PUT /options/5
router.delete("/:id", optionController.deleteOption);                      // DELETE /options/5

module.exports = router;
