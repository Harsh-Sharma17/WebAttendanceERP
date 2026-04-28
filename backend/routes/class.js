const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Class = require("../models/Class");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");

const { verifyToken, authorizeRole } = require("../config/middleware/authMiddleware");


// ===============================
// ➕ ADD CLASS (ADMIN ONLY)
// ===============================
router.post("/", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    let { className } = req.body;

    if (!className || !className.trim()) {
      return res.status(400).json({
        success: false,
        message: "Class name is required"
      });
    }

    className = className.trim();

    // ✅ Duplicate check (case insensitive)
    const existingClass = await Class.findOne({
      className: { $regex: `^${className}$`, $options: "i" }
    });

    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: "Class already exists"
      });
    }

    const newClass = await Class.create({ className });

    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      class: newClass
    });

  } catch (err) {
    console.error("Add class error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to add class"
    });
  }
});


// ===============================
// 📥 GET CLASSES (🔥 FIXED)
// ===============================
router.get("/", verifyToken, async (req, res) => {
  try {

    let classes = [];

    // ============================
    // ADMIN → ALL CLASSES
    // ============================
    if (req.user.role === "admin") {
      classes = await Class.find().sort({ className: 1 });
    }

    // ============================
    // TEACHER → ASSIGNED CLASSES
    // ============================
    else if (req.user.role === "teacher") {

      const teacher = await Teacher.findOne({ user: req.user.id });

      if (!teacher) {
        return res.json({
          success: true,
          classes: []   // 🔥 return empty instead of error
        });
      }

      // 🔥 If no classes assigned → return ALL (temporary fix)
      if (!teacher.classes || teacher.classes.length === 0) {
        classes = await Class.find().sort({ className: 1 });
      } else {
        classes = await Class.find({
          _id: { $in: teacher.classes }
        }).sort({ className: 1 });
      }
    }

    // ============================
    // STUDENT → THEIR CLASS
    // ============================
    else if (req.user.role === "student") {

      const student = await Student.findOne({ user: req.user.id });

      if (!student) {
        return res.json({
          success: true,
          classes: []
        });
      }

      const cls = await Class.findById(student.class);

      classes = cls ? [cls] : [];
    }

    // ============================
    // DEFAULT (🔥 IMPORTANT FIX)
    // ============================
    else {
      classes = await Class.find().sort({ className: 1 });
    }

    return res.json({
      success: true,
      count: classes.length,
      classes
    });

  } catch (err) {
    console.error("Fetch class error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch classes"
    });
  }
});


// ===============================
// ❌ DELETE CLASS (ADMIN ONLY)
// ===============================
router.delete("/:id", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID"
      });
    }

    const existingClass = await Class.findById(id);

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    // ❌ Prevent delete if students exist
    const students = await Student.findOne({ class: id });
    if (students) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete class with students"
      });
    }

    await Class.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Class deleted successfully"
    });

  } catch (err) {
    console.error("Delete class error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to delete class"
    });
  }
});

module.exports = router;