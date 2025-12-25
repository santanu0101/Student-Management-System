import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createStudentSchema,
  updateStudentSchema,
  updateStudentStatusSchema,
} from "./student.validation.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { StudentController } from "./student.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student management APIs
 */

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Create a new student (Admin only)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, department]
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Rahul
 *               lastName:
 *                 type: string
 *                 example: Sharma
 *               email:
 *                 type: string
 *                 example: rahul@gmail.com
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               dob:
 *                  type: string
 *                  example: "2000-01-15"
 *               gender:
 *                  type: string
 *                  enum: [Male, Female, Other]
 *               address:
 *                  type: string
 *                  example: "123, Main Street, City"
 *               department:
 *                 type: string
 *                 example: 65e123abc456
 *     responses:
 *       201:
 *         description: Student created successfully
 *       409:
 *         description: Student already exists
 */

router.post(
  "/",
  authMiddleware,
  authorize("admin"),
  validate(createStudentSchema),
  asyncHandler(StudentController.createStudent)
);

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get all students (Admin, Instructor)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, SUSPENDED, GRADUATED]
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Students fetched successfully
 */

router.get(
  "/",
  authMiddleware,
  authorize("admin", "instructor"),
  asyncHandler(StudentController.getAllStudents)
);

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Get student by ID
 *     tags: [Students]
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
 *         description: Student details fetched
 *       404:
 *         description: Student not found
 */

router.get(
  "/:id",
  authMiddleware,
  authorize("admin", "instructor"),
  asyncHandler(StudentController.getStudentById)
);

/**
 * @swagger
 * /students/{id}:
 *   patch:
 *     summary: Update student details (Admin only)
 *     tags: [Students]
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student updated successfully
 */

router.patch(
  "/:id",
  authMiddleware,
  authorize("admin"),
  validate(updateStudentSchema),
  asyncHandler(StudentController.updateStudent)
);

/**
 * @swagger
 * /students/{id}:
 *   delete:
 *     summary: Soft delete a student (Admin only)
 *     tags: [Students]
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
 *         description: Student deleted successfully
 */

router.delete(
  "/:id",
  authMiddleware,
  authorize("admin"),
  asyncHandler(StudentController.softDeleteStudent)
);

/**
 * @swagger
 * /students/{id}/status:
 *   patch:
 *     summary: Change student status (Admin only)
 *     tags: [Students]
 *     security:
 *       -BearerAuth: []
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
 *                 enum: [ACTIVE, SUSPENDED, GRADUATED]
 *     responses:
 *       200:
 *         description: Status updated successfully
 */

router.patch(
  "/:id/status",
  authMiddleware,
  authorize("admin"),
  validate(updateStudentStatusSchema),
  asyncHandler(StudentController.changeStatus)
);

/**
 * @swagger
 * /students/{id}/courses:
 *   get:
 *     summary: Get student enrolled courses
 *     tags: [Students]
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
 *         description: Courses fetched successfully
 */

router.get(
  "/:id/courses",
  authMiddleware,
  authorize("admin", "instructor"),
  asyncHandler(StudentController.getStudentCourses)
);

/**
 * @swagger
 * /students/{id}/payments:
 *   get:
 *     summary: Get student payment history (Admin only)
 *     tags: [Students]
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
 *         description: Payment history fetched successfully
 */

router.get(
  "/:id/payments",
  authMiddleware,
  authorize("admin"),
  asyncHandler(StudentController.getStudentPayments)
);

/**
 * @swagger
 * /students/{id}/attendance:
 *   get:
 *     summary: Get student attendance records
 *     tags: [Students]
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
 *         description: Attendance records fetched successfully
 */

router.get(
  "/:id/attendance",
  authMiddleware,
  authorize("admin", "instructor"),
  asyncHandler(StudentController.getStudentAttendance)
);

export default router;
