import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
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
      enum: ["online", "cash", "bank"],
      required: true,
    },

    description: { type: String },

    status: {
      type: String,
      enum: ["paid", "pending", "failed"],
      default: "pending",
    },
    
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
