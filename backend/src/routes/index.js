import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import departmentRoutes from "../modules/department/department.routes.js";
import studentRoutes from "../modules/student/student.routes.js";


const router = Router();

router.use("/auth", authRoutes);
router.use("/departments", departmentRoutes);
router.use("/students", studentRoutes);

export default router;
