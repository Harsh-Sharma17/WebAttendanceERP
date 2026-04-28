const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // 🔥 LINK WITH USER MODEL (VERY IMPORTANT)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔥 MULTIPLE CLASSES
    classes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        required: true,
      }
    ],

    // 🔥 MULTIPLE SUBJECTS (NOT STRING)
    subjects: [
      {
        type: String,
        trim: true,
      }
    ],

    // OPTIONAL FACE DATA (if needed later)
    faceImage: {
      type: String,
      default: null,
    },

    faceDescriptor: {
      type: [Number],
      default: [],
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("Teacher", teacherSchema);