import Razorpay from "razorpay";
import { validateObjectId } from "../../utils/validateObjectId.js";
import mongoose from "mongoose";
import { Course, Enrollment, Payment, Student } from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { ENROLLMENT_STATUS, PAYMENT_STATUS } from "../../constants/status.js";
import { safeRedis } from "../../utils/redisTryCatch.js";
import redis from "../../config/redis.js";
import { razorpay } from "../../config/razorpay.js";
import { ALLOWED_ENROLLMENT_TRANSITIONS } from "../../constants/enrollmentTransitions.js";

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

      const existingPayment = await Payment.findOne({
        student,
        course,
        status: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING] },
      }).session(session);

      if (existingPayment) {
        throw new ApiError(409, "Payment already in progress");
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

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    if (payment.razorpayOrderId !== razorpay_order_id) {
      throw new ApiError(400, "Order ID mismatch");
    }

    if (payment.status === PAYMENT_STATUS.PAID) {
      return {
        verified: true,
        message: "Already paid (confirmed by webhook)",
      };
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = PAYMENT_STATUS.PROCESSING;

    await payment.save();
    return {
      verified: true,
      message: "Payment verified, awaiting confirmation",
    };
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

    const eventId = req.body.id;
    if (!eventId) {
      throw new ApiError(400, "Webhook event ID missing");
    }

    const replayKey = `webhook:razorpay:${eventId}`;

    const alreadyProcessed = await redis.get(replayKey);
    if (alreadyProcessed) {
      return;
    }

    await redis.setex(replayKey, 60 * 60 * 24, "1");

    const event = req.body;

    if (event.event === "payment.failed") {
      const razorpayPayment = event.payload.payment.entity;
      const razorpayOrderId = razorpayPayment.order_id;

      const payment = await Payment.findOne({ razorpayOrderId });

      if (!payment) return;

      if (payment.status === PAYMENT_STATUS.PAID) return;

      payment.status = PAYMENT_STATUS.FAILED;
      payment.razorpayPaymentId = razorpayPayment.id;
      await payment.save();

      await safeRedis(() => redis.del("payments:list"));
      await safeRedis(() => redis.del(`payments:student:${payment.student}`));

      return;
    }

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

      if (razorpayPayment.amount !== payment.amount * 100) {
        throw new ApiError(
          400,
          `Payment amount mismatch. Expected ${payment.amount * 100}, got ${
            razorpayPayment.amount
          }`
        );
      }

      if (razorpayPayment.currency !== "INR") {
        throw new ApiError(400, "Invalid currency");
      }

      if (razorpayPayment.order_id !== payment.razorpayOrderId) {
        throw new ApiError(400, "Order ID mismatch");
      }

      if (payment.status === PAYMENT_STATUS.PAID) {
        await session.commitTransaction();
        session.endSession();
        return;
      }

      payment.status = PAYMENT_STATUS.PAID;
      payment.razorpayPaymentId = razorpayPayment.id;
      await payment.save({ session });

      const existingEnrollment = await Enrollment.findOne({
        student: payment.student,
        course: payment.course,
      }).session(session);

      let enrollment;

      if (!existingEnrollment) {
        enrollment = await Enrollment.create(
          [
            {
              student: payment.student,
              course: payment.course,
              status: ENROLLMENT_STATUS.ENROLLED,
            },
          ],
          { session }
        );
      } else {
        const allowedTransitions =
          ALLOWED_ENROLLMENT_TRANSITIONS[existingEnrollment.status] || [];

        if (!allowedTransitions.includes(ENROLLMENT_STATUS.ENROLLED)) {
          throw new ApiError(
            409,
            `Enrollment cannot transition from ${existingEnrollment.status} to ENROLLED`
          );
        }

        existingEnrollment.status = ENROLLMENT_STATUS.ENROLLED;
        await existingEnrollment.save({ session });

        enrollment = existingEnrollment;
      }

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

  static async retryPayment(paymentId) {
    validateObjectId(paymentId, "Payment ID");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const oldPayment = await Payment.findById(paymentId).session(session);
      if (!oldPayment) {
        throw new ApiError(404, "Payment not found");
      }

      if (
        ![PAYMENT_STATUS.FAILED, PAYMENT_STATUS.EXPIRED].includes(
          oldPayment.status
        )
      ) {
        throw new ApiError(400, "Payment cannot be retried");
      }

      const alreadyPaid = await Payment.findOne({
        student: oldPayment.student,
        course: oldPayment.course,
        status: PAYMENT_STATUS.PAID,
      }).session(session);

      if (alreadyPaid) {
        throw new ApiError(409, "Course already paid");
      }

      const razorpayOrder = await razorpay.orders.create({
        amount: oldPayment.amount * 100,
        currency: "INR",
        receipt: `retry_${Date.now()}`,
      });

      const newPayment = await Payment.create(
        [
          {
            student: oldPayment.student,
            course: oldPayment.course,
            amount: oldPayment.amount,
            method: oldPayment.method,
            razorpayOrderId: razorpayOrder.id,
            status: PAYMENT_STATUS.PENDING,
            description: "Retry course payment",
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return {
        payment: newPayment[0],
        razorpayOrder,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
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
