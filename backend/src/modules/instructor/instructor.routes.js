import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { InstructorController } from "./instructor.controller.js";
import {
  createInstructorSchema,
  updateInstructorSchema,
  updateInstructorStatusSchema,
} from "./instructor.validation.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Instructors
 *   description: Instructor management APIs
 */

/**
 * @swagger
 * /instructors:
 *   post:
 *     summary: Create instructor (Admin only)
 *     tags: [Instructors]
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
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *               address:
 *                 type: string
 *               hireDate:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       201:
 *         description: Instructor created successfully
 */
router.post(
  "/",
  authMiddleware,
  authorize("admin"),
  validate(createInstructorSchema),
  asyncHandler(InstructorController.createInstructor)
);

/**
 * @swagger
 * /instructors:
 *   get:
 *     summary: Get all instructors
 *     tags: [Instructors]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Instructors fetched successfully
 */
router.get(
  "/",
  authMiddleware,
  authorize("admin"),
  asyncHandler(InstructorController.getAllInstructors)
);

/**
 * @swagger
 * /instructors/{id}:
 *   get:
 *     summary: Get instructor by ID
 *     tags: [Instructors]
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
 *         description: Instructor fetched successfully
 *       404:
 *         description: Instructor not found
 */
router.get(
  "/:id",
  authMiddleware,
  authorize("admin", "instructor"),
  asyncHandler(InstructorController.getInstructorById)
);

/**
 * @swagger
 * /instructors/{id}:
 *   patch:
 *     summary: Update instructor details (Admin only)
 *     tags: [Instructors]
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
 *               department:
 *                 type: string
 *     responses:
 *       200:
 *         description: Instructor updated successfully
 */
router.patch(
  "/:id",
  authMiddleware,
  authorize("admin"),
  validate(updateInstructorSchema),
  asyncHandler(InstructorController.updateInstructorStatus)
);

/**
 * @swagger
 * /instructors/{id}/status:
 *   patch:
 *     summary: Change instructor status (Admin only)
 *     tags: [Instructors]
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
 *                 enum: [active, suspended, retired]
 *     responses:
 *       200:
 *         description: Instructor status changed successfully
 */
router.patch(
  "/:id/status",
  authMiddleware,
  authorize("admin"),
  validate(updateInstructorStatusSchema),
  asyncHandler(InstructorController.changeInstructorStatus)
);

/**
 * @swagger
 * /instructors/{id}:
 *   delete:
 *     summary: Remove instructor (Admin only)
 *     tags: [Instructors]
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
 *         description: Instructor deleted successfully
 */
router.delete(
  "/:id",
  authMiddleware,
  authorize("admin"),
  asyncHandler(InstructorController.deleteInstructor)
);

/**
 * @swagger
 * /instructors/{id}/courses:
 *   get:
 *     summary: Get courses taught by instructor
 *     tags: [Instructors]
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
 *         description: Instructor courses fetched successfully
 */
router.get(
  "/:id/courses",
  authMiddleware,
  authorize("admin", "instructor"),
  asyncHandler(InstructorController.getInstructorCourses)
);

export default router;
