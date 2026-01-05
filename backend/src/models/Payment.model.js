import mongoose, { Schema } from "mongoose";
import { PAYMENT_STATUS } from "../constants/status.js";
import { PAYMENT_METHOD } from "../constants/enums.js";

const paymentSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    method: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true,
    },

    description: {
      type: String,
    },

    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
      index: true,
    },

    razorpaySignature: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },

    enrollment: {
      type: Schema.Types.ObjectId,
      ref: "Enrollment",
      default: null,
    },
  },
  { timestamps: true }
);


paymentSchema.index(
  { student: 1, course: 1 },
  {
    unique: true,
    partialFilterExpression: { status: PAYMENT_STATUS.PAID },
  }
);

paymentSchema.index({ createdAt: -1 });

export const Payment = mongoose.model("Payment", paymentSchema);
