import mongoose from "mongoose";
import redis from "../../config/redis.js";
import {
  ATTENDANCE_STATUS,
  ENROLLMENT_STATUS,
  STUDENT_STATUS,
} from "../../constants/status.js";
import { Attendance, Enrollment, Student } from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { safeRedis } from "../../utils/redisTryCatch.js";
import { validateObjectId } from "../../utils/validateObjectId.js";

export class AttendanceService {
  static async markAttendance(payload) {
    const { studentId, courseId, date, status } = payload;
    validateObjectId(studentId, "Student id");
    validateObjectId(courseId, "Course id");

    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate)) {
      throw new ApiError(400, "Invalid date");
    }
    attendanceDate.setHours(0, 0, 0, 0);

    if (!Object.values(ATTENDANCE_STATUS).includes(status)) {
      throw new ApiError(400, "Invalid attendance status");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const student = await Student.findOne(
        {
          _id: studentId,
          status: STUDENT_STATUS.ACTIVE,
          isActive: true,
        },
        null,
        { session }
      );

      if (!student) {
        throw new ApiError(404, "Student not found");
      }

      const enrolledCourse = await Enrollment.findOne(
        {
          student: studentId,
          course: courseId,
          status: ENROLLMENT_STATUS.ENROLLED,
        },
        null,
        { session }
      );
      if (!enrolledCourse) {
        throw new ApiError(404, "Not enrolled in this course");
      }

      const attendance = await Attendance.create(
        [
          {
            student: student._id,
            course: courseId,
            date: attendanceDate,
            status,
          },
        ],
        { session }
      );

      const [attendanceDoc] = attendance;

      await session.commitTransaction();
      session.endSession();

      await safeRedis(async () => {
        const keys = await redis.keys("attendance:list:*");
        if (keys.length) await redis.del(keys);
      });

      await safeRedis(() => redis.del(`attendance:student:${studentId}`));
      await safeRedis(() => redis.del(`attendance:course:${courseId}`));
      await safeRedis(() =>
        redis.del(`attendance:percentage:${attendanceDoc.student}`)
      );
      await safeRedis(() =>
        redis.del(
          `attendance:percentage:${attendanceDoc.student}:${attendanceDoc.course}`
        )
      );

      return attendanceDoc;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      if (error.code === 11000) {
        throw new ApiError(
          409,
          "Attendance already marked for this student, course and date"
        );
      }
      throw error;
    }
  }

  static async getAttendance(query) {
    const { page = 1, limit = 10 } = query;

    const cacheKey = `attendance:list:${page}:${limit}`;
    const cached = await safeRedis(() => redis.get(cacheKey));
    if (cached) return JSON.parse(cached);

    const attendance = await Attendance.find()
      .populate("student", "name email")
      .populate("course", "name code")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    await safeRedis(() =>
      redis.setex(cacheKey, 300, JSON.stringify(attendance))
    );

    return attendance;
  }

  static async getAttendanceByStudent(studentId) {
    validateObjectId(studentId, "Student ID");

    const cacheKey = `attendance:student:${studentId}`;
    const cached = await safeRedis(() => redis.get(cacheKey));
    if (cached) return JSON.parse(cached);

    const attendance = await Attendance.find({ student: studentId })
      .populate("course", "name code")
      .sort({ date: -1 })
      .lean();

    await safeRedis(() =>
      redis.setex(cacheKey, 300, JSON.stringify(attendance))
    );

    return attendance;
  }

  static async getAttendanceByCourse(courseId) {
    validateObjectId(courseId, "Course ID");

    const cacheKey = `attendance:course:${courseId}`;

    const cached = await safeRedis(() => redis.get(cacheKey));
    if (cached) return JSON.parse(cached);

    const attendance = await Attendance.find({ course: courseId })
      .populate("student", "name email")
      .sort({ date: -1 })
      .lean();

    await safeRedis(() =>
      redis.setex(cacheKey, 300, JSON.stringify(attendance))
    );

    return attendance;
  }

  static async updateAttendance(id, payload) {
    validateObjectId(id, "Attendance ID");

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      throw new ApiError(404, "Attendance not found");
    }

    console.log(payload.status)

    if (payload.status) {
      if (!Object.values(ATTENDANCE_STATUS).includes(payload.status)) {
        throw new ApiError(400, "Invalid attendance status");
      }
      attendance.status = payload.status;
    }
    if (payload.date) {
      const newDate = new Date(payload.date);
      if (isNaN(newDate)) {
        throw new ApiError(400, "Invalid date");
      }
      newDate.setHours(0, 0, 0, 0);
      attendance.date = newDate;
    }

    await attendance.save();

    await safeRedis(async () => {
      const keys = await redis.keys("attendance:list:*");
      if (keys.length) await redis.del(keys);
    });

    await safeRedis(() =>
      redis.del(`attendance:student:${attendance.student}`)
    );
    await safeRedis(() => redis.del(`attendance:course:${attendance.course}`));
    await safeRedis(() =>
      redis.del(`attendance:percentage:${attendance.student}`)
    );
    await safeRedis(() =>
      redis.del(
        `attendance:percentage:${attendance.student}:${attendance.course}`
      )
    );

    return attendance;
  }

  static async deleteAttendance(id) {
    validateObjectId(id, "Attendance ID");

    const attendance = await Attendance.findByIdAndDelete(id);
    if (!attendance) {
      throw new ApiError(404, "Attendance not found");
    }

    await safeRedis(async () => {
      const keys = await redis.keys("attendance:list:*");
      if (keys.length) await redis.del(keys);
    });

    await safeRedis(() =>
      redis.del(`attendance:student:${attendance.student}`)
    );
    await safeRedis(() => redis.del(`attendance:course:${attendance.course}`));
    await safeRedis(() =>
      redis.del(`attendance:percentage:${attendance.student}`)
    );
    await safeRedis(() =>
      redis.del(
        `attendance:percentage:${attendance.student}:${attendance.course}`
      )
    );

    return { success: true };
  }

  static async getAttendancePercentage(studentId, courseId = null) {
    validateObjectId(studentId, "Student ID");

    if (courseId) {
      validateObjectId(courseId, "Course ID");
    }

    const matchStage = {
      student: new mongoose.Types.ObjectId(studentId),
    };

    if (courseId) {
      matchStage.course = new mongoose.Types.ObjectId(courseId);
    }

    const cacheKey = courseId
      ? `attendance:percentage:${studentId}:${courseId}`
      : `attendance:percentage:${studentId}`;

    const cached = await safeRedis(() => redis.get(cacheKey));
    if (cached) return JSON.parse(cached);

    const result = await Attendance.aggregate([
      { $match: matchStage },

      {
        $group: {
          _id: null,
          totalClasses: { $sum: 1 },
          presentCount: {
            $sum: {
              $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0],
            },
          },
          absentCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "absent"] }, 1, 0],
            },
          },
        },
      },
    ]);

    if (result.length === 0) {
      return {
        studentId,
        courseId,
        totalClasses: 0,
        present: 0,
        absent: 0,
        percentage: 0,
      };
    }

    const { totalClasses, presentCount, absentCount } = result[0];

    const percentage =
      totalClasses === 0
        ? 0
        : Number(((presentCount / totalClasses) * 100).toFixed(2));

    const response = {
      studentId,
      courseId,
      totalClasses,
      present: presentCount,
      absent: absentCount,
      percentage,
    };

    await safeRedis(() => redis.setex(cacheKey, 300, JSON.stringify(response)));

    return response;
  }
}
