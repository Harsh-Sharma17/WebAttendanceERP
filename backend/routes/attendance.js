const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Attendance = require("../models/Attendance");
const Student = require("../models/Student");


// =======================================
// ✅ MARK ATTENDANCE
// =======================================
router.post("/", async (req, res) => {
  try {
    let { student, name, class: classId, subject, status } = req.body;

    console.log("📩 Incoming Attendance:", req.body);

    // ============================
    // ✅ NAME → STUDENT
    // ============================
    if (!student && name) {
      const studentData = await Student.findOne({ name });

      if (!studentData) {
        return res.status(404).json({
          success: false,
          message: "Student not found"
        });
      }

      student = studentData._id;
      classId = studentData.class;
    }

    // ============================
    // ✅ VALIDATION
    // ============================
    if (!student || !classId || !subject) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    status = (status || "present").toLowerCase();
    subject = subject.trim();

    // ============================
    // ✅ VERIFY STUDENT
    // ============================
    const studentData = await Student.findById(student);

    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // ============================
    // ✅ TODAY RANGE (LOCAL SAFE)
    // ============================
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // ============================
    // ✅ PREVENT DUPLICATE
    // ============================
    const existing = await Attendance.findOne({
      student,
      class: classId,
      subject,
      date: { $gte: start, $lt: end }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked today"
      });
    }

    // ============================
    // ✅ SAVE
    // ============================
    const attendance = await Attendance.create({
      student,
      class: classId,
      subject,
      status,
      date: new Date()
    });

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      attendance
    });

  } catch (error) {
    console.error("🔥 ATTENDANCE ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// =======================================
// ✅ GET ATTENDANCE (FINAL VERSION)
// =======================================
router.get("/", async (req, res) => {
  try {
    const { class: classId, subject, date, month } = req.query;

    let query = {};

    // ============================
    // ✅ CLASS FILTER
    // ============================
    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      query.class = new mongoose.Types.ObjectId(classId);
    }

    // ============================
    // ✅ SUBJECT FILTER
    // ============================
    if (subject && subject.trim() !== "") {
      query.subject = subject.trim();
    }

    // ============================
    // ✅ DATE FILTER (DAY)
    // ============================
    if (date) {
      const [year, m, day] = date.split("-").map(Number);

      const start = new Date(year, m - 1, day, 0, 0, 0);
      const end = new Date(year, m - 1, day + 1, 0, 0, 0);

      query.date = {
        $gte: start,
        $lt: end
      };

      console.log("📅 Day Filter:", start, end);
    }

    // ============================
    // ✅ MONTH FILTER (NEW 🔥)
    // ============================
    if (month) {
      const [year, m] = month.split("-").map(Number);

      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 1);

      query.date = {
        $gte: start,
        $lt: end
      };

      console.log("📅 Month Filter:", start, end);
    }

    console.log("🔍 FINAL QUERY:", query);

    const records = await Attendance.find(query)
      .populate("student", "name rollNo")
      .populate("class", "className")
      .sort({ date: -1 });

    console.log("📦 RECORDS FOUND:", records.length);

    res.json({
      success: true,
      count: records.length,
      attendance: records
    });

  } catch (error) {
    console.error("🔥 GET ATTENDANCE ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =======================================
module.exports = router;