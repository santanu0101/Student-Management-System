import { Router } from "express";
import { DashboardController } from "./dashboard.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constants/roles.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Role-based dashboard APIs
 */

/**
 * @swagger
 * /dashboard/admin:
 *   get:
 *     summary: Admin dashboard
 *     description: Get system-wide statistics for admin users
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalStudents:
 *                           type: number
 *                           example: 1200
 *                         activeStudents:
 *                           type: number
 *                           example: 980
 *                         totalInstructors:
 *                           type: number
 *                           example: 75
 *                         totalCourses:
 *                           type: number
 *                           example: 180
 *                         totalDepartments:
 *                           type: number
 *                           example: 12
 *                     payments:
 *                       type: object
 *                       properties:
 *                         totalRevenue:
 *                           type: number
 *                           example: 4500000
 *                         pendingPayments:
 *                           type: number
 *                           example: 32
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an admin)
 */
router.get(
  "/admin",
  authMiddleware,
  authorize(ROLES.ADMIN),
  DashboardController.adminDashboard
);

/**
 * @swagger
 * /dashboard/instructor:
 *   get:
 *     summary: Instructor dashboard
 *     description: Get dashboard data for instructor
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Instructor dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         coursesTeaching:
 *                           type: number
 *                           example: 4
 *                         totalStudents:
 *                           type: number
 *                           example: 180
 *                     attendance:
 *                       type: object
 *                       properties:
 *                         markedToday:
 *                           type: boolean
 *                           example: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an instructor)
 */
router.get(
  "/instructor",
  authMiddleware,
  authorize(ROLES.INSTRUCTOR),
  DashboardController.instructorDashboard
);

/**
 * @swagger
 * /dashboard/student:
 *   get:
 *     summary: Student dashboard
 *     description: Get dashboard data for student
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Student dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         coursesEnrolled:
 *                           type: number
 *                           example: 6
 *                         attendanceCount:
 *                           type: number
 *                           example: 92
 *                         pendingFees:
 *                           type: number
 *                           example: 1500
 *                     notifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             example: Fee Reminder
 *                           message:
 *                             type: string
 *                             example: Please pay pending fees
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not a student)
 */
router.get(
  "/student",
  authMiddleware,
  authorize(ROLES.STUDENT),
  DashboardController.studentDashboard
);

export default router;
