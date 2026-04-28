const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    rollNo: {
      type: String,
      required: [true, "Roll number is required"],
      trim: true,
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class is required"],
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },

    faceImage: {
      type: String, // base64 image
      default: null,
    },

    // 🔥 IMPORTANT: Face Descriptor (128 length array)
    faceDescriptor: {
      type: [Number],
      required: [true, "Face descriptor is required"],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length === 128;
        },
        message: "Face descriptor must be an array of 128 numbers",
      },
    },
  },
  { timestamps: true }
);

// ========================================
// 🔥 UNIQUE INDEX (PREVENT DUPLICATES)
// ========================================
studentSchema.index({ rollNo: 1, class: 1 }, { unique: true });

// ========================================
// 🔥 CLEAN OUTPUT (OPTIONAL BUT GOOD)
// ========================================
studentSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Student", studentSchema);