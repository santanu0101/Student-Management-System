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
    },

    description: { type: String },
    
    credits: {
      type: Number,
      required: true,
      min: 0,
    },

    semester: {
      type: String,
      required: true,
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


export const Course = mongoose.model("Course", courseSchema);
