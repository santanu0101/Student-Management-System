import {
  Student,
  Instructor,
  Course,
  Department,
  Enrollment,
  Payment,
  Attendance,
  Marks,
  Notification,
} from "../../models/index.js";

import { getCachedDashboard, setCachedDashboard } from "./dashboard.cache.js";

export class DashboardService {

  static async adminDashboard() {
    const cacheKey = "dashboard:admin";
    const cached = await getCachedDashboard(cacheKey);
    if (cached) return cached;

    const [
      totalStudents,
      activeStudents,
      totalInstructors,
      totalCourses,
      totalDepartments,
      revenue,
      pendingPayments,
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: "ACTIVE" }),
      Instructor.countDocuments({ isActive: true }),
      Course.countDocuments(),
      Department.countDocuments(),
      Payment.aggregate([
        { $match: { status: "SUCCESS" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Payment.countDocuments({ status: "PENDING" }),
    ]);

    const data = {
      stats: {
        totalStudents,
        activeStudents,
        totalInstructors,
        totalCourses,
        totalDepartments,
      },
      payments: {
        totalRevenue: revenue[0]?.total || 0,
        pendingPayments,
      },
    };

    await setCachedDashboard(cacheKey, data, 30); // 30s cache
    return data;
  }

  /* ================= INSTRUCTOR ================= */

  static async instructorDashboard(instructorId) {
    const cacheKey = `dashboard:instructor:${instructorId}`;
    const cached = await getCachedDashboard(cacheKey);
    if (cached) return cached;

    const courses = await Course.find({ instructor: instructorId }).select(
      "_id"
    );

    const courseIds = courses.map((c) => c._id);

    const [studentsCount, todayAttendance] = await Promise.all([
      Enrollment.countDocuments({ course: { $in: courseIds } }),
      Attendance.findOne({
        course: { $in: courseIds },
        date: new Date().toDateString(),
      }),
    ]);

    const data = {
      stats: {
        coursesTeaching: courses.length,
        totalStudents: studentsCount,
      },
      attendance: {
        markedToday: Boolean(todayAttendance),
      },
    };

    await setCachedDashboard(cacheKey, data, 15);
    return data;
  }

  /* ================= STUDENT ================= */

  static async studentDashboard(studentId) {
    const cacheKey = `dashboard:student:${studentId}`;
    const cached = await getCachedDashboard(cacheKey);
    if (cached) return cached;

    const [enrollments, attendance, payments, notifications] =
      await Promise.all([
        Enrollment.find({ student: studentId }),
        Attendance.countDocuments({ student: studentId, status: "PRESENT" }),
        Payment.find({ student: studentId, status: "PENDING" }),
        Notification.find({ user: studentId }).limit(5),
      ]);

    const data = {
      stats: {
        coursesEnrolled: enrollments.length,
        attendanceCount: attendance,
        pendingFees: payments.reduce((a, p) => a + p.amount, 0),
      },
      notifications,
    };

    await setCachedDashboard(cacheKey, data, 10);
    return data;
  }
}
