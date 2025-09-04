// app.js
const express = require("express");
const app = express();
const auth = require("./middlewares/authMiddleware");
app.use(express.json());

const cors = require("cors");
app.use(cors({ origin: "http://localhost:5173" })); // cổng FE Vite

const authRoutes = require("./routes/authRoutes");   // register/login/me
const userRoutes = require("./routes/userRoutes");   // CRUD admin
const subjectRoutes = require("./routes/subjectRoutes");    //subject
const chapterRoutes = require("./routes/chapterRoutes");    //chapter
const questionRoutes = require("./routes/questionRoutes");  //question
const optionRoutes = require("./routes/optionRoutes");  //options
const attemptRoutes = require("./routes/attemptRoutes");  //attempt
const answerRoutes = require("./routes/answerRoutes");  //answer
const resultSummaryRoutes = require("./routes/resultSummaryRoutes");  //res suma
const attemptQuestionRoutes = require("./routes/attemptQuestionRoutes");    //attemp ques

app.use("/api/attempt-questions",auth, attemptQuestionRoutes);
app.use("/api/resultsummary",auth, resultSummaryRoutes);
app.use("/api/answers",auth, answerRoutes);
app.use("/api/attempts",auth, attemptRoutes);
app.use("/api/options",auth, optionRoutes);
app.use("/api/questions",auth, questionRoutes);
app.use("/api/chapters",auth, chapterRoutes);
app.use("/api/subjects",auth, subjectRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users",userRoutes);



app.get("/", (req, res) => res.send("API running 🚀"));
module.exports = app;
