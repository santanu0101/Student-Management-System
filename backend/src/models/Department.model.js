import mongoose, { Schema } from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    building: {
      type: String,
      trime: true,
    },

    headOfDepartment: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      default: null,
    },
  },
  { timestamps: true }
);

export const Department = mongoose.model("Department", departmentSchema);
