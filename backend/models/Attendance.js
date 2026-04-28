const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },

  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true
  },

  // ✅ IMPORTANT (YOU WERE MISSING THIS)
  subject: {
    type: String,
    required: true,
    trim: true
  },

  date: {
    type: Date,
    default: Date.now
  },

  status: {
    type: String,
    enum: ["present", "absent"],
    default: "present"
  }

}, {
  timestamps: true
});


// =======================================
// ✅ PREVENT DUPLICATES (BEST VERSION)
// =======================================
// One student → one subject → one class → one day

attendanceSchema.index(
  { student: 1, class: 1, subject: 1, date: 1 },
  { unique: true }
);


module.exports = mongoose.model("Attendance", attendanceSchema);