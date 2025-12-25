import mongoose, { Schema } from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    nameLower: {
      type: String,
      unique: true,
      index: true,
    },

    building: {
      type: String,
      trim: true,
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

departmentSchema.pre("save", function () {
  if (this.name) {
    this.nameLower = this.name.toLowerCase();
  }
});

export const Department = mongoose.model("Department", departmentSchema);
