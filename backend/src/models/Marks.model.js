import mongoose, { Schema } from "mongoose";

const marksSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    examType: {
      type: String,
      enum: ["mid", "final", "assignment", "quiz"],
      required: true,
    },

    score: {
      type: Number,
      required: true,
    },

    maxScore: {
      type: Number,
      required: true,
    },

    examDate: {
      type: Date,
      required: true,
    },
    
  },
  { timestamps: true }
);

export const Marks = mongoose.model("Marks", marksSchema);
