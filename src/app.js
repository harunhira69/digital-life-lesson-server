const express = require("express");
const cors = require("cors");

const routes = require("./routes");

const app = express();

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: [
      process.env.SITE_DOMAIN,
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);

// Health check
app.get("/", (req, res) => {
  res.send("Digital Life Lesson API is running 🚀");
});

// API Routes (versioned)
app.use("/api/v1", routes);

module.exports = app;