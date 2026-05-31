require("dotenv").config();

const app = require("./app");
const { connectDB } = require("./config/db");

// safety check (important)
if (!process.env.PORT) {
  console.log("⚠️ PORT not defined, using default 3000");
}

async function startServer() {
  try {
    // 1. Connect Database first
    await connectDB();
    console.log("✅ Database connected successfully");

    // 2. Set PORT
    const PORT = process.env.PORT || 3000;

    // 3. Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:");
    console.error(error);

    process.exit(1);
  }
}

// handle unhandled errors (extra safety)
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

startServer();