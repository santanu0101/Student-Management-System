import mongoose, { Schema } from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    building: {
      type: String,
      trime: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    headOfDepartment: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      default: null,
    },
  },
  { timestamps: true }
);

departmentSchema.index(
  { name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

export const Department = mongoose.model("Department", departmentSchema);
