import mongoose, { Schema } from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },

    description: String,

    credits: {
      type: Number,
      required: true,
      min: 0,
    },

    semester: {
      type: String,
      required: true,
    },

    price: {                    
      type: Number,
      required: true,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    instructor: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      required: true,
    },
  },
  { timestamps: true }
);

// Helpful indexes
courseSchema.index({ department: 1, isActive: 1 });
courseSchema.index({ instructor: 1 });

export const Course = mongoose.model("Course", courseSchema);
