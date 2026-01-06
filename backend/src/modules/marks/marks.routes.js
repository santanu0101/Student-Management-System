import { Router } from "express";
import { MarksController } from "./marks.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  addMarksSchema,
  deleteMarksSchema,
  getAllMarksSchema,
  marksByCourseSchema,
  marksByStudentSchema,
  updateMarksSchema,
} from "./marks.validation.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Marks
 *   description: Marks / Assessment management APIs
 */

/**
 * @swagger
 * /marks:
 *   post:
 *     summary: Add marks for a student
 *     tags: [Marks]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - courseId
 *               - examType
 *               - score
 *               - maxScore
 *               - examDate
 *             properties:
 *               studentId:
 *                 type: string
 *               courseId:
 *                 type: string
 *               examType:
 *                 type: string
 *                 enum: [mid, final, assignment, quiz]
 *               score:
 *                 type: number
 *               maxScore:
 *                 type: number
 *               examDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Marks added successfully
 *       403:
 *         description: Student not enrolled
 */
router.post(
  "/",
  authMiddleware,
  authorize("admin", "instructor"),
  validate(addMarksSchema),
  asyncHandler(MarksController.addMarks)
);

/**
 * @swagger
 * /marks:
 *   get:
 *     summary: Get all marks (paginated)
 *     tags: [Marks]
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
 *         description: Marks fetched successfully
 */
router.get(
  "/",
  authMiddleware,
  authorize("admin", "instructor"),
  asyncHandler(MarksController.getAllMarks)
);

/**
 * @swagger
 * /marks/student/{studentId}:
 *   get:
 *     summary: Get marks of a specific student
 *     tags: [Marks]
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
 *         description: Student marks fetched successfully
 */
router.get(
  "/student/:studentId",
  authMiddleware,
  authorize("admin", "instructor", "student"),
  validate(marksByStudentSchema),
  asyncHandler(MarksController.getMarksByStudent)
);

/**
 * @swagger
 * /marks/course/{courseId}:
 *   get:
 *     summary: Get marks of a specific course
 *     tags: [Marks]
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
 *         description: Course marks fetched successfully
 */
router.get(
  "/course/:courseId",
  authMiddleware,
  authorize("admin", "instructor"),
  validate(marksByCourseSchema),
  asyncHandler(MarksController.getMarksByCourse)
);

/**
 * @swagger
 * /marks/{id}:
 *   patch:
 *     summary: Update marks
 *     tags: [Marks]
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
 *               score:
 *                 type: number
 *               maxScore:
 *                 type: number
 *               examType:
 *                 type: string
 *               examDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Marks updated successfully
 */
router.patch(
  "/:id",
  authMiddleware,
  authorize("admin", "instructor"),
  validate(updateMarksSchema),
  asyncHandler(MarksController.updateMarks)
);

/**
 * @swagger
 * /marks/{id}:
 *   delete:
 *     summary: Delete marks
 *     tags: [Marks]
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
 *         description: Marks deleted successfully
 */
router.delete(
  "/:id",
  authMiddleware,
  authorize("admin"),
  validate(deleteMarksSchema),
  asyncHandler(MarksController.deleteMarks)
);

export default router;
