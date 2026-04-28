const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Teacher = require("../models/Teacher");
const User = require("../models/User");

const { verifyToken, authorizeRole } = require("../config/middleware/authMiddleware");


// ==================================================
// 🧪 TEST ROUTE (FOR DEBUGGING)
// ==================================================
router.get("/test", (req, res) => {
  console.log("✅ /api/teachers/test hit");
  res.send("Teacher route working ✅");
});


// ==================================================
// ✅ GET LOGGED-IN TEACHER PROFILE
// ==================================================
router.get("/me", verifyToken, async (req, res) => {
  try {
    console.log("👤 TOKEN:", req.user);

    const userId = req.user.id || req.user.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload"
      });
    }

    const teacher = await Teacher.findOne({ user: userId })
      .populate("classes", "_id className")
      .populate("user", "email role");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found"
      });
    }

    res.json({
      success: true,
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.user?.email,
        subjects: teacher.subjects || [],
        classes: teacher.classes
      }
    });

  } catch (error) {
    console.error("❌ /me ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// ==================================================
// ➕ ADD TEACHER (ADMIN)
// ==================================================
router.post("/", verifyToken, authorizeRole("admin"), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let { name, email, classes, subjects } = req.body;

    if (!name || !email) throw new Error("Name and email are required");
    if (!Array.isArray(classes) || classes.length === 0)
      throw new Error("Select at least one class");
    if (!Array.isArray(subjects) || subjects.length === 0)
      throw new Error("Add at least one subject");

    name = name.trim();
    email = email.toLowerCase().trim();

    // 🔍 Duplicate check
    if (await Teacher.findOne({ email }))
      throw new Error("Teacher already exists");

    if (await User.findOne({ email }))
      throw new Error("Email already used");

    // 👤 Create user
    const user = await User.create([{
      name,
      email,
      password: email + "@123",
      role: "teacher"
    }], { session });

    // 🏫 Validate class IDs
    const classIds = classes.map(c => {
      if (!mongoose.Types.ObjectId.isValid(c)) {
        throw new Error("Invalid class ID");
      }
      return new mongoose.Types.ObjectId(c);
    });

    // 👨‍🏫 Create teacher
    const teacher = await Teacher.create([{
      user: user[0]._id,
      name,
      email,
      classes: classIds,
      subjects
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      teacher: teacher[0]
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("❌ ADD TEACHER ERROR:", error);

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});


// ==================================================
// 📥 GET ALL TEACHERS (ADMIN)
// ==================================================
router.get("/", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate("classes", "className")
      .populate("user", "email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: teachers.length,
      teachers
    });

  } catch (error) {
    console.error("❌ GET ALL ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch teachers"
    });
  }
});


// ==================================================
// ✏️ UPDATE TEACHER
// ==================================================
router.put("/:id", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    let { name, email, classes, subjects } = req.body;

    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) throw new Error("Teacher not found");

    name = name.trim();
    email = email.toLowerCase().trim();

    teacher.name = name;
    teacher.email = email;

    if (Array.isArray(classes)) {
      teacher.classes = classes.map(c => {
        if (!mongoose.Types.ObjectId.isValid(c)) {
          throw new Error("Invalid class ID");
        }
        return new mongoose.Types.ObjectId(c);
      });
    }

    if (Array.isArray(subjects)) {
      teacher.subjects = subjects;
    }

    await teacher.save();

    // Sync user
    await User.findByIdAndUpdate(teacher.user, { name, email });

    res.json({
      success: true,
      message: "Teacher updated successfully",
      teacher
    });

  } catch (error) {
    console.error("❌ UPDATE ERROR:", error);

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});


// ==================================================
// ❌ DELETE TEACHER
// ==================================================
router.delete("/:id", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) throw new Error("Teacher not found");

    await User.findByIdAndDelete(teacher.user);
    await Teacher.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Teacher deleted successfully"
    });

  } catch (error) {
    console.error("❌ DELETE ERROR:", error);

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});


module.exports = router;