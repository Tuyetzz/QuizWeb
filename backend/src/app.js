// app.js
const express = require("express");
const app = express();
app.use(express.json());

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

app.use("/api/attempt-questions", attemptQuestionRoutes);
app.use("/api/resultsummary", resultSummaryRoutes);
app.use("/api/answers", answerRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/options", optionRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);


app.get("/", (req, res) => res.send("API running 🚀"));
module.exports = app;
