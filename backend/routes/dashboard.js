const express = require("express");
const router = express.Router();

const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Class = require("../models/Class");

// ✅ FIXED IMPORT (IMPORTANT)
const { verifyToken } = require("../config/middleware/authMiddleware");

// ===============================
// 📊 DASHBOARD DATA
// ===============================
router.get("/", verifyToken, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalClasses = await Class.countDocuments();

    return res.json({
      success: true,
      totalStudents,
      totalTeachers,
      totalClasses,
    });

  } catch (error) {
    console.error("Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
    });
  }
});

module.exports = router;