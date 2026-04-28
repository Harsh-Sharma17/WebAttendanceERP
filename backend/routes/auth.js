const express = require("express");
const router = express.Router();
require("dotenv").config();

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "create_admin_secure_key";


// ========================================
// 👑 CREATE ADMIN (SECURED)
// ========================================
router.get("/create-admin", async (req, res) => {
  try {
    const { key } = req.query;

    if (key !== ADMIN_SECRET) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const existingAdmin = await User.findOne({ email: "admin@gmail.com" });

    if (existingAdmin) {
      return res.json({
        success: true,
        message: "Admin already exists"
      });
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const admin = new User({
      name: "Admin",
      email: "admin@gmail.com",
      password: hashedPassword,
      role: "admin"
    });

    await admin.save();

    res.json({
      success: true,
      message: "Admin created successfully"
    });

  } catch (error) {
    console.error("CREATE ADMIN ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// ========================================
// 🔐 LOGIN
// ========================================
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    // ✅ Normalize email
    email = email?.toLowerCase().trim();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // ✅ FIX: fallback if comparePassword not defined
    let isMatch = false;

    if (typeof user.comparePassword === "function") {
      isMatch = await user.comparePassword(password);
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const validRoles = ["admin", "teacher", "student"];
    if (!validRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Invalid user role"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      role: user.role,
      name: user.name
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error during login"
    });
  }
});


// ========================================
// 🔑 FORGOT PASSWORD
// ========================================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    res.json({
      success: true,
      message: "If email exists, reset link sent"
    });

  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;