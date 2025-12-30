import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { CourseController } from "./course.controller.js";
import {
  createCourseSchema,
  updateCourseSchema,
  assignInstructorSchema,
} from "./course.validation.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course management APIs
 */

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - credits
 *               - semester
 *               - department
 *               - instructor
 *             properties:
 *               name:
 *                 type: string
 *                 example: Data Structures
 *               code:
 *                 type: string
 *                 example: CS101
 *               description:
 *                 type: string
 *                 example: Core computer science course
 *               credits:
 *                 type: number
 *                 example: 4
 *               semester:
 *                 type: string
 *                 example: Semester 1
 *               department:
 *                 type: string
 *                 example: 64f8c1b8e4b0c123456789ab
 *               instructor:
 *                 type: string
 *                 example: 64f8c1b8e4b0c123456789ac
 *     responses:
 *       201:
 *         description: Course created successfully
 */
router.post(
  "/",
  authMiddleware,
  authorize("admin"),
  validate(createCourseSchema),
  asyncHandler(CourseController.createCourse)
);

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Courses fetched successfully
 */
router.get(
  "/",
  authMiddleware,
  authorize("admin", "instructor"),
  asyncHandler(CourseController.getAllCourses)
);

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 64f8c1b8e4b0c123456789ad
 *     responses:
 *       200:
 *         description: Course fetched successfully
 */
router.get(
  "/:id",
  authMiddleware,
  authorize("admin", "instructor"),
  asyncHandler(CourseController.getCourseById)
);

/**
 * @swagger
 * /courses/{id}:
 *   patch:
 *     summary: Update course
 *     tags: [Courses]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               credits:
 *                 type: number
 *               semester:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       200:
 *         description: Course updated successfully
 */
router.patch(
  "/:id",
  authMiddleware,
  authorize("admin"),
  validate(updateCourseSchema),
  asyncHandler(CourseController.updateCourse)
);

/**
 * @swagger
 * /courses/{id}:
 *   delete:
 *     summary: Delete course
 *     tags: [Courses]
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
 *         description: Course deleted successfully
 */
router.delete(
  "/:id",
  authMiddleware,
  authorize("admin"),
  asyncHandler(CourseController.deleteCourse)
);

/**
 * @swagger
 * /courses/{id}/instructor:
 *   patch:
 *     summary: Assign instructor to course
 *     tags: [Courses]
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
 *             required:
 *               - instructor
 *             properties:
 *               instructor:
 *                 type: string
 *                 example: 64f8c1b8e4b0c123456789ac
 *     responses:
 *       200:
 *         description: Instructor assigned successfully
 */
router.patch(
  "/:id/instructor",
  authMiddleware,
  authorize("admin"),
  validate(assignInstructorSchema),
  asyncHandler(CourseController.assignInstructor)
);

/**
 * @swagger
 * /courses/{id}/students:
 *   get:
 *     summary: Get enrolled students
 *     tags: [Courses]
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
 *         description: Enrolled students fetched successfully
 */
router.get(
  "/:id/students",
  authMiddleware,
  authorize("admin", "instructor"),
  asyncHandler(CourseController.getEnrolledStudents)
);

export default router;
