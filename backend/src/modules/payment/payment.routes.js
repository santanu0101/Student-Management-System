import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { PaymentController } from "./payment.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { actionRateLimiter, adminHeavyRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management APIs
 */

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Create payment & generate Razorpay order
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [student, course]
 *             properties:
 *               student:
 *                 type: string
 *               course:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment initiated successfully
 */
router.post(
  "/",
  authMiddleware,
  authorize("admin", "student"),
  actionRateLimiter,
  asyncHandler(PaymentController.createPayment)
);

/**
 * @swagger
 * /payments/verify:
 *   post:
 *     summary: Verify Razorpay payment & enroll student
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpay_order_id
 *               - razorpay_payment_id
 *               - razorpay_signature
 *               - paymentId
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *               paymentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified and student enrolled
 *       400:
 *         description: Invalid payment signature
 */
router.post("/verify", asyncHandler(PaymentController.verifyPayment));

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get all payments (Admin only)
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Payments fetched successfully
 */
router.get(
  "/",
  authMiddleware,
  authorize("admin"),
  asyncHandler(PaymentController.getPayments)
);

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment fetched successfully
 *       404:
 *         description: Payment not found
 */
router.get(
  "/:id",
  authMiddleware,
  authorize("admin"),
  asyncHandler(PaymentController.getPaymentById)
);

/**
 * @swagger
 * /payments/student/{studentId}:
 *   get:
 *     summary: Get payments by student
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student payments fetched successfully
 */
router.get(
  "/student/:studentId",
  authMiddleware,
  authorize("admin", "student"),
  asyncHandler(PaymentController.getPaymentsByStudent)
);

/**
 * @swagger
 * /payments/{id}/status:
 *   patch:
 *     summary: Update payment status (Admin only)
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [paid, pending, failed]
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 */
router.patch(
  "/:id/status",
  authMiddleware,
  authorize("admin"),
  adminHeavyRateLimiter,
  asyncHandler(PaymentController.updatePaymentStatus)
);

/**
 * @swagger
 * /payments/{id}:
 *   delete:
 *     summary: Delete payment (Admin only)
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment deleted successfully
 */
router.delete(
  "/:id",
  authMiddleware,
  authorize("admin"),
  adminHeavyRateLimiter,
  asyncHandler(PaymentController.deletePayment)
);

/**
 * @swagger
 * /payments/retry/{paymentId}:
 *   post:
 *     summary: Retry a failed or expired payment
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment to retry
 *     responses:
 *       200:
 *         description: New payment created for retry
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     payment:
 *                       type: object
 *                       description: Newly created payment document
 *                     razorpayOrder:
 *                       type: object
 *                       description: Razorpay order details for retry
 *       400:
 *         description: Payment cannot be retried
 *       404:
 *         description: Payment not found
 *       409:
 *         description: Course already paid
 */
router.post("/retry/:paymentId", authMiddleware, authorize("student", "admin"), actionRateLimiter, PaymentController.retryPayment);


/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Handle Razorpay webhook for payment events
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Raw webhook payload from Razorpay
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid signature or missing data
 */
router.post("/webhook", asyncHandler(PaymentController.razorpayWebhook));

export default router;
