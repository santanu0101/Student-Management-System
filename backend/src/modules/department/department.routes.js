import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { DepartmentController } from "./department.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  assignHodSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
} from "./department.validation.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Departments
 *   description: Department management APIs
 */

/**
 * @swagger
 * /departments:
 *   get:
 *     summary: Get all departments
 *     tags: [Departments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Departments fetched successfully
 */
router.get("/", authMiddleware, asyncHandler(DepartmentController.getAll));

/**
 * @swagger
 * /departments/{id}:
 *   get:
 *     summary: Get department by ID
 *     tags: [Departments]
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
 *         description: Department fetched successfully
 *       404:
 *         description: Department not found
 */
router.get("/:id", authMiddleware, asyncHandler(DepartmentController.getById));

/**
 * @swagger
 * /departments:
 *   post:
 *     summary: Create department (Admin only)
 *     tags: [Departments]
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
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               building:
 *                 type: string
 *     responses:
 *       201:
 *         description: Department created successfully
 *       409:
 *         description: Department already exists
 */
router.post(
  "/",
  authMiddleware,
  authorize("admin"),
  validate(createDepartmentSchema),
  asyncHandler(DepartmentController.create)
);

/**
 * @swagger
 * /departments/{id}:
 *   patch:
 *     summary: Update department (Admin only)
 *     tags: [Departments]
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
 *               building:
 *                 type: string
 *     responses:
 *       200:
 *         description: Department updated successfully
 *       404:
 *         description: Department not found
 *       409:
 *         description: Department already exists
 */

router.patch(
  "/:id",
  authMiddleware,
  authorize("admin"),
  validate(updateDepartmentSchema),
  asyncHandler(DepartmentController.update)
);

/**
 * @swagger
 * /departments/{id}:
 *   delete:
 *     summary: Delete department (Admin only)
 *     tags: [Departments]
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
 *         description: Department deleted Successfully
 *       404:
 *         description: Department not found
 */
router.delete(
  "/:id",
  authMiddleware,
  authorize("admin"),
  asyncHandler(DepartmentController.delete)
);

/**
 * @swagger
 * /departments/{id}/hod:
 *   patch:
 *     summary: Assign Head of Department (Admin only)
 *     tags: [Departments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Department ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - instructorId
 *             properties:
 *               instructorId:
 *                 type: string
 *                 description: Instructor ID to assign as HOD
 *     responses:
 *       200:
 *         description: HOD assigned successfully
 *       404:
 *         description: Department or Instructor not found
 */

router.patch(
  "/:id/hod",
  authMiddleware,
  authorize("admin"),
  validate(assignHodSchema),
  asyncHandler(DepartmentController.assignHOD)
);

export default router;
