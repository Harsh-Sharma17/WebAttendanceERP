const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    section: {
      type: String,
      trim: true,
      default: "",
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Class", classSchema);