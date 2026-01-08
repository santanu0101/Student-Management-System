import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { ClassScheduleController } from "./schedule.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createScheduleSchema,
  deleteScheduleSchema,
  getAllSchedulesSchema,
  getScheduleByCourseSchema,
  getScheduleByInstructorSchema,
  updateScheduleSchema,
} from "./schedule.validation.js";
import { adminHeavyRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Class Schedules
 *   description: Class schedule management APIs
 */

/**
 * @swagger
 * /schedules:
 *   post:
 *     summary: Create class schedule
 *     tags: [Class Schedules]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - course
 *               - instructor
 *               - dayOfWeek
 *               - startTime
 *               - endTime
 *             properties:
 *               course:
 *                 type: string
 *               instructor:
 *                 type: string
 *               dayOfWeek:
 *                 type: string
 *                 example: Mon
 *               startTime:
 *                 type: string
 *                 example: "10:00"
 *               endTime:
 *                 type: string
 *                 example: "11:30"
 *               room:
 *                 type: string
 *     responses:
 *       201:
 *         description: Schedule created successfully
 */
router.post(
  "/",
  authMiddleware,
  authorize("admin"),
  adminHeavyRateLimiter,
  validate(createScheduleSchema),
  asyncHandler(ClassScheduleController.createSchedule)
);

/**
 * @swagger
 * /schedules:
 *   get:
 *     summary: Get all class schedules
 *     tags: [Class Schedules]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Schedules fetched successfully
 */
router.get(
  "/",
  authMiddleware,
  authorize("admin", "instructor"),
  asyncHandler(ClassScheduleController.getAllSchedules)
);

/**
 * @swagger
 * /schedules/course/{courseId}:
 *   get:
 *     summary: Get course schedule
 *     tags: [Class Schedules]
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
 *         description: Course schedule fetched successfully
 */
router.get(
  "/course/:courseId",
  authMiddleware,
  authorize("admin", "instructor", "student"),
  validate(getScheduleByCourseSchema),
  asyncHandler(ClassScheduleController.getScheduleByCourse)
);

/**
 * @swagger
 * /schedules/instructor/{instructorId}:
 *   get:
 *     summary: Get instructor schedule
 *     tags: [Class Schedules]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instructorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Instructor schedule fetched successfully
 */
router.get(
  "/instructor/:instructorId",
  authMiddleware,
  authorize("admin", "instructor"),
  validate(getScheduleByInstructorSchema),
  asyncHandler(ClassScheduleController.getScheduleByInstructor)
);

/**
 * @swagger
 * /schedules/{id}:
 *   patch:
 *     summary: Update class schedule
 *     tags: [Class Schedules]
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
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 */
router.patch(
  "/:id",
  authMiddleware,
  authorize("admin"),
  adminHeavyRateLimiter,
  validate(updateScheduleSchema),
  asyncHandler(ClassScheduleController.updateSchedule)
);

/**
 * @swagger
 * /schedules/{id}:
 *   delete:
 *     summary: Delete class schedule
 *     tags: [Class Schedules]
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
 *         description: Schedule deleted successfully
 */
router.delete(
  "/:id",
  authMiddleware,
  authorize("admin"),
  adminHeavyRateLimiter,
  validate(deleteScheduleSchema),
  asyncHandler(ClassScheduleController.deleteSchedule)
);

export default router;
