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

app.use("/api/attempts", attemptRoutes);
app.use("/api/options", optionRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);


app.get("/", (req, res) => res.send("API running 🚀"));
module.exports = app;
