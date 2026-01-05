import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import departmentRoutes from "../modules/department/department.routes.js";
import studentRoutes from "../modules/student/student.routes.js";
import instructorRoutes from "../modules/instructor/instructor.routes.js";
import courseRoutes from "../modules/course/course.routes.js";
import enrollmentRoutes from "../modules/enrollment/enrollment.routes.js"
import paymentRoutes from "../modules/payment/payment.routes.js"

const router = Router();

router.use("/auth", authRoutes);
router.use("/departments", departmentRoutes);
router.use("/students", studentRoutes);
router.use("/instructors", instructorRoutes);
router.use("/courses", courseRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("payments", paymentRoutes)

export default router;
