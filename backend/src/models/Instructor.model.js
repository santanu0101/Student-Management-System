import mongoose, { Schema } from "mongoose";
import { INSTRUCTOR_STATUS } from "../constants/status.js";
import { GENDER } from "../constants/enums.js";


const instructorSchema = new mongoose.Schema(
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

    hireDate: {
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
      enum: [INSTRUCTOR_STATUS.ACTIVE, INSTRUCTOR_STATUS.ONLEAVE, INSTRUCTOR_STATUS.RETIRED],
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

export const Instructor = mongoose.model("Instructor", instructorSchema);
