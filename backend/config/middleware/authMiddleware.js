require("dotenv").config();
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

// ========================================
// 🔐 VERIFY TOKEN MIDDLEWARE
// ========================================
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ❌ No header
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing",
      });
    }

    // ❌ Wrong format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    const token = authHeader.split(" ")[1];

    // ❌ Empty token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user to request
    req.user = decoded;

    next();

  } catch (error) {
    console.error("🔥 Auth Error:", error.message);

    return res.status(401).json({
      success: false,
      message:
        error.name === "TokenExpiredError"
          ? "Token expired"
          : "Invalid token",
    });
  }
};

// ========================================
// 🔐 AUTHORIZE ROLE MIDDLEWARE
// ========================================
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    try {
      // ❌ No user (verifyToken not used)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized (no user found)",
        });
      }

      // ❌ Role not allowed
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied (insufficient role)",
        });
      }

      next();

    } catch (error) {
      console.error("🔥 Role Error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Authorization error",
      });
    }
  };
};

// ========================================
// EXPORT
// ========================================
module.exports = {
  verifyToken,
  authorizeRole,
};