import express from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  markAttendance,
  getAttendance,
  getAttendanceByStudent,
  getAttendanceByCourse,
  updateAttendance,
  deleteAttendance,
  getAttendancePercentage,
} from "./attendance.controller.js";
import { ROLES } from "../../constants/roles.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  deleteAttendanceSchema,
  getAttendanceByCourseSchema,
  getAttendanceByStudentSchema,
  getAttendancePercentageSchema,
  getAttendanceSchema,
  markAttendanceSchema,
  updateAttendanceSchema,
} from "./attendance.validation.js";
import { actionRateLimiter, adminHeavyRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance management APIs
 */

/**
 * @swagger
 * /attendance:
 *   post:
 *     summary: Mark attendance
 *     tags: [Attendance]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [student, course, date, status]
 *             properties:
 *               studentId:
 *                 type: string
 *               courseId:
 *                 type: string
 *               date:
 *                 type: string
 *                 example: 2025-01-06
 *               status:
 *                 type: string
 *                 enum: [present, absent, late]
 *     responses:
 *       201:
 *         description: Attendance marked successfully
 */
router.post(
  "/",
  authMiddleware,
  authorize(ROLES.ADMIN, ROLES.INSTRUCTOR),
  actionRateLimiter,
  validate(markAttendanceSchema),
  asyncHandler(markAttendance)
);

/**
 * @swagger
 * /attendance:
 *   get:
 *     summary: Get all attendance (paginated)
 *     tags: [Attendance]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Attendance fetched successfully
 */
router.get(
  "/",
  authMiddleware,
  authorize(ROLES.ADMIN, ROLES.INSTRUCTOR),
  asyncHandler(getAttendance)
);

/**
 * @swagger
 * /attendance/student/{studentId}:
 *   get:
 *     summary: Get attendance by student
 *     tags: [Attendance]
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
 *         description: Student attendance fetched successfully
 */
router.get(
  "/student/:studentId",
  authMiddleware,
  authorize(ROLES.ADMIN, ROLES.INSTRUCTOR, ROLES.STUDENT),
  validate(getAttendanceByStudentSchema),
  asyncHandler(getAttendanceByStudent)
);

/**
 * @swagger
 * /attendance/course/{courseId}:
 *   get:
 *     summary: Get attendance by course
 *     tags: [Attendance]
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
 *         description: Course attendance fetched successfully
 */
router.get(
  "/course/:courseId",
  authMiddleware,
  authorize(ROLES.ADMIN, ROLES.INSTRUCTOR),
  validate(getAttendanceByCourseSchema),
  asyncHandler(getAttendanceByCourse)
);

/**
 * @swagger
 * /attendance/{id}:
 *   patch:
 *     summary: Update attendance
 *     tags: [Attendance]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [present, absent, late]
 *               date:
 *                 type: string
 *     responses:
 *       200:
 *         description: Attendance updated successfully
 */
router.patch(
  "/:id",
  authMiddleware,
  authorize(ROLES.ADMIN, ROLES.INSTRUCTOR),
  actionRateLimiter,
  validate(updateAttendanceSchema),
  asyncHandler(updateAttendance)
);

/**
 * @swagger
 * /attendance/{id}:
 *   delete:
 *     summary: Delete attendance
 *     tags: [Attendance]
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
 *         description: Attendance deleted successfully
 */
router.delete(
  "/:id",
  authMiddleware,
  authorize(ROLES.ADMIN),
  adminHeavyRateLimiter,
  validate(deleteAttendanceSchema),
  asyncHandler(deleteAttendance)
);

/**
 * @swagger
 * /attendance/student/{studentId}/percentage:
 *   get:
 *     summary: Get attendance percentage (optional course filter)
 *     tags: [Attendance]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attendance percentage fetched successfully
 */
router.get(
  "/student/:studentId/percentage",
  authMiddleware,
  authorize(ROLES.ADMIN, ROLES.INSTRUCTOR, ROLES.STUDENT),
  validate(getAttendancePercentageSchema),
  asyncHandler(getAttendancePercentage)
);

export default router;
