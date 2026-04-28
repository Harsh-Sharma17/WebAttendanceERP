const express = require("express");
const router = express.Router();

const Student = require("../models/Student");
const User = require("../models/User");
const Class = require("../models/Class");

const mongoose = require("mongoose");

const { verifyToken, authorizeRole } = require("../config/middleware/authMiddleware");


// ========================================
// ➕ ADD STUDENT (FIXED)
// ========================================
router.post("/", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {

    console.log("📥 Incoming Data:", req.body); // DEBUG

    const { name, rollNo, class: studentClass, faceImage, faceDescriptor } = req.body;

    // =========================
    // VALIDATION
    // =========================
    if (!name || !rollNo || !studentClass || !faceDescriptor) {
      return res.status(400).json({
        success: false,
        message: "All fields including face data are required",
      });
    }

    // =========================
    // VALID ObjectId
    // =========================
    if (!mongoose.Types.ObjectId.isValid(studentClass)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    // =========================
    // CHECK CLASS
    // =========================
    const classExists = await Class.findById(studentClass);
    if (!classExists) {
      return res.status(400).json({
        success: false,
        message: "Class not found",
      });
    }

    // =========================
    // CHECK DUPLICATE
    // =========================
    const existingStudent = await Student.findOne({
      rollNo: rollNo.trim(),
      class: studentClass,
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Roll number already exists in this class",
      });
    }

    // =========================
    // CREATE USER
    // =========================
    const email = `${rollNo.trim()}@student.com`;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      name: name.trim(),
      email,
      password: rollNo.trim() + "@123",
      role: "student",
    });

    // =========================
    // FIX FACE DESCRIPTOR
    // =========================
    const safeDescriptor = Array.isArray(faceDescriptor)
      ? faceDescriptor.map(Number)
      : [];

    // =========================
    // CREATE STUDENT
    // =========================
    const student = await Student.create({
      name: name.trim(),
      rollNo: rollNo.trim(),
      class: studentClass,
      user: user._id,
      faceImage: faceImage || null,
      faceDescriptor: safeDescriptor
    });

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      student,
    });

  } catch (error) {

    console.error("❌ ADD STUDENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
});


// ========================================
// 📥 GET STUDENTS
// ========================================
router.get("/", verifyToken, async (req, res) => {
  try {

    const students = await Student.find({
      faceDescriptor: { $exists: true, $ne: [] }
    })
      .populate("class", "className")
      .populate("user", "email");

    res.json({
      success: true,
      count: students.length,
      students
    });

  } catch (error) {
    console.error("❌ GET STUDENTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch students"
    });
  }
});


// ========================================
// ❌ DELETE STUDENT
// ========================================
router.delete("/:id", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    await User.findByIdAndDelete(student.user);
    await Student.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Student deleted successfully"
    });

  } catch (error) {
    console.error("❌ DELETE STUDENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete student"
    });
  }
});

module.exports = router;