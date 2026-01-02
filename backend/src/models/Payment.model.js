import mongoose, { Schema } from "mongoose";
import { PAYMENT_STATUS } from "../constants/status.js";
import { PAYMENT_METHOD } from "../constants/enums.js";

const paymentSchema = new Schema(
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

    amount: {
      type: Number,
      required: true,
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    method: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true,
    },

    description: { type: String },

    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },

    enrollment: {
      type: Schema.Types.ObjectId,
      ref: "Enrollment",
      default: null,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ student: 1, course: 1 });
paymentSchema.index({ createdAt: -1 });

export const Payment = mongoose.model("Payment", paymentSchema);
