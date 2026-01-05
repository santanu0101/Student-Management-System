import Razorpay from "razorpay";
import { validateObjectId } from "../../utils/validateObjectId.js";
import mongoose from "mongoose";
import { Course, Enrollment, Payment, Student } from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { ENROLLMENT_STATUS, PAYMENT_STATUS } from "../../constants/status.js";
import { safeRedis } from "../../utils/redisTryCatch.js";
import redis from "../../config/redis.js";
import { razorpay } from "../../config/razorpay.js";

export class PaymentService {
  static async createPayment(payload) {
    const { student, course, method } = payload;

    validateObjectId(student, "Student ID");
    validateObjectId(course, "Course ID");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const studentExists = await Student.findOne({
        _id: student,
        isActive: true,
      }).session(session);

      if (!studentExists) {
        throw new ApiError(404, "Student not found");
      }

      const courseData = await Course.findOne({
        _id: course,
        isActive: true,
      }).session(session);

      if (!courseData) {
        throw new ApiError(404, "Course not found or inactive");
      }

      const razorpayOrder = await razorpay.orders.create({
        amount: courseData.price * 100,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
      });

      const payment = await Payment.create(
        [
          {
            student,
            course,
            amount: courseData.price,
            method,
            razorpayOrderId: razorpayOrder.id,
            status: PAYMENT_STATUS.PENDING,
            description: "Course payment initiated",
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return {
        payment: payment[0],
        razorpayOrder,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  static async handleRazorpayWebhook(req) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const razorpaySignature = req.headers["x-razorpay-signature"];
    if (!razorpaySignature) {
      throw new ApiError(400, "Missing Razorpay signature");
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.rawBody)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      throw new ApiError(400, "Invalid webhook signature");
    }

    const event = req.body;

    if (event.event !== "payment.captured") return;

    const razorpayPayment = event.payload.payment.entity;
    const razorpayOrderId = razorpayPayment.order_id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

      const payment = await Payment.findOne({
        razorpayOrderId,
      }).session(session);

      if (!payment) {
        throw new ApiError(404, "Payment record not found");
      }

      if (payment.status === PAYMENT_STATUS.PAID) {
        await session.commitTransaction();
        session.endSession();
        return;
      }

      payment.status = PAYMENT_STATUS.PAID;
      payment.razorpayPaymentId = razorpayPayment.id;
      await payment.save({ session });

      const enrollment = await Enrollment.findOneAndUpdate(
        {
          student: payment.student,
          course: payment.course,
        },
        {
          status: ENROLLMENT_STATUS.ENROLLED,
        },
        {
          upsert: true,
          new: true,
          session,
        }
      );

      payment.enrollment = enrollment._id;
      await payment.save({ session });

      await session.commitTransaction();
      session.endSession();

      await safeRedis(() => redis.del("payments:list"));
      await safeRedis(() => redis.del(`payments:student:${payment.student}`));
      await safeRedis(() =>
        redis.del(`enrollments:student:${payment.student}`)
      );
      await safeRedis(() => redis.del(`enrollments:course:${payment.course}`));
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  static async verifyPayment(payload) {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId,
    } = payload;

    validateObjectId(paymentId, "Payment ID");

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new ApiError(400, "Invalid payment signature");
    }

    await Payment.findByIdAndUpdate(paymentId, {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: PAYMENT_STATUS.PROCESSING,
    });

    return {
      verified: true,
      message: "Payment verified, awaiting confirmation",
    };
  }

  static async getAllPayment() {
    const cacheKey = "payments:list";

    let cached = null;
    await safeRedis(async () => {
      cached = await redis.get(cacheKey);
    });

    if (cached) return JSON.parse(cached);

    const payment = await Payment.find()
      .populate("student", "firstName lastName email")
      .populate("course", "name code")
      .sort({ createdAt: -1 })
      .lean();

    await safeRedis(() => redis.setex(cacheKey, 300, JSON.stringify(payment)));

    return payment;
  }

  static async getPaymentsByStudent(studentId) {
    validateObjectId(studentId, "Student ID");

    const cacheKey = `payment:student:${studentId}`;

    let cached = null;
    await safeRedis(async () => {
      cached = await redis.get(cacheKey);
    });

    if (cached) {
      return JSON.parse(cached);
    }

    const payments = await Payment.find({ student: studentId })
      .populate("course", "name code")
      .sort({ createdAt: -1 })
      .lean();

    await safeRedis(() => redis.setex(cacheKey, 300, JSON.stringify(payments)));

    return payments;
  }

  static async updatePaymentStatus(id, status) {
    validateObjectId(id, "Payment ID");

    if (!Object.values(PAYMENT_STATUS).includes(status)) {
      throw new ApiError(400, "Invalid payment status");
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    payment.status = status;
    await payment.save();

    await safeRedis(() => redis.del("payments:list"));
    await safeRedis(() => redis.del(`payments:student:${payment.student}`));

    return payment;
  }

  static async deletePayment(id) {
    validateObjectId(id, "Payment ID");

    const payment = await Payment.findByIdAndDelete(id);
    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    await safeRedis(() => redis.del("payments:list"));
    await safeRedis(() => redis.del(`payments:student:${payment.student}`));

    return payment;
  }
}
