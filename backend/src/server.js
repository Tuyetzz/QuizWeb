// server.js
require("dotenv").config();
const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // tạo/sync bảng từ models (chỉ nên dùng cho dev/test)
    await sequelize.sync({ alter: true });
    console.log("✅ All models synchronized");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Unable to connect to DB:", err);
    process.exit(1);
  }
})();
