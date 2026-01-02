import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { EnrollmentController } from "./enrollment.controller.js";


const router = Router();

/**
 * @swagger
 * tags:
 *   name: Enrollments
 *   description: Student course enrollment APIs
 */

/**
 * @swagger
 * /enrollments:
 *   post:
 *     summary: Enroll student into a course
 *     tags: [Enrollments]
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
 *                 example: 64f2c9e2a2b4e45f12345678
 *               course:
 *                 type: string
 *                 example: 64f2c9e2a2b4e45f87654321
 *     responses:
 *       201:
 *         description: Student enrolled successfully
 */
router.post(
  "/",
  authMiddleware,
  authorize("admin"),
  asyncHandler(EnrollmentController.enrollStudent)
);

/**
 * @swagger
 * /enrollments:
 *   get:
 *     summary: Get all enrollments
 *     tags: [Enrollments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Enrollments fetched successfully
 */
router.get(
  "/",
  authMiddleware,
  authorize("admin", "instructor"),
  asyncHandler(EnrollmentController.getEnrollments)
);

/**
 * @swagger
 * /enrollments/student/{studentId}:
 *   get:
 *     summary: Get enrollments of a student
 *     tags: [Enrollments]
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
 *         description: Student enrollments fetched successfully
 */
router.get(
  "/student/:studentId",
  authMiddleware,
  authorize("admin", "instructor"),
  asyncHandler(EnrollmentController.getEnrollmentsByStudent)
);

/**
 * @swagger
 * /enrollments/course/{courseId}:
 *   get:
 *     summary: Get enrollments of a course
 *     tags: [Enrollments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course enrollments fetched successfully
 */
router.get(
  "/course/:courseId",
  authMiddleware,
  authorize("admin", "instructor"),
  asyncHandler(EnrollmentController.getEnrollmentsByCourse)
);

/**
 * @swagger
 * /enrollments/{id}/status:
 *   patch:
 *     summary: Update enrollment status (drop / complete)
 *     tags: [Enrollments]
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
 *                 enum: [enrolled, dropped, completed]
 *     responses:
 *       200:
 *         description: Enrollment status updated successfully
 */
router.patch(
  "/:id/status",
  authMiddleware,
  authorize("admin", "instructor"),
  asyncHandler(EnrollmentController.updateEnrollmentStatus)
);

export default router;
