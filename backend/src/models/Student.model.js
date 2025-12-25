import mongoose, { Schema } from "mongoose";
import { STUDENT_STATUS } from "../constants/status.js";
import { GENDER } from "../constants/enums.js";

const studentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    dob: { type: Date },

    gender: {
      type: String,
      enum: [GENDER.MALE, GENDER.FEMALE, GENDER.OTHER],
    },

    address: { type: String },

    admissionDate: {
      type: Date,
      default: Date.now,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    status: {
      type: String,
      enum: [STUDENT_STATUS.ACTIVE, STUDENT_STATUS.GRADUATED, STUDENT_STATUS.SUSPENDED],
      default: "active",
      index: true,
    },

    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
  },
  { timestamps: true }
);

export const Student = mongoose.model("Student", studentSchema);
