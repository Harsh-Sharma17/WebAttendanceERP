require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");

const app = express();

// ======================
// DATABASE
// ======================
connectDB();

// ======================
// CORS
// ======================
app.use(cors({
  origin: true,
  credentials: true
}));

// ======================
// MIDDLEWARE
// ======================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// ======================
// PATHS
// ======================
const frontendPath = path.join(__dirname, "..", "frontend");
const modelsPath = path.join(__dirname, "public", "models");

console.log("Frontend Path:", frontendPath);
console.log("Models Path:", modelsPath);

// ======================
// STATIC FILES
// ======================

// ✅ Serve face-api models
app.use("/models", express.static(modelsPath));

// ✅ Serve frontend files
app.use(express.static(frontendPath));

// ======================
// API ROUTES
// ======================
app.use("/api/auth", require("./routes/auth"));
app.use("/api/students", require("./routes/students"));
app.use("/api/teachers", require("./routes/teacher"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/classes", require("./routes/class"));
app.use("/api/dashboard", require("./routes/dashboard"));

// ======================
// TEST ROUTE
// ======================
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Backend working"
  });
});

// ======================
// FALLBACK (IMPORTANT)
// ======================
app.use((req, res) => {
  if (
    req.originalUrl.startsWith("/api") ||
    req.originalUrl.startsWith("/models")
  ) {
    return res.status(404).json({
      success: false,
      message: "Route not found"
    });
  }

  res.sendFile(path.join(frontendPath, "login.html"));
});

// ======================
// ERROR HANDLER
// ======================
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err.stack);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://127.0.0.1:${PORT}`);
});