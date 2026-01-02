import { ENROLLMENT_STATUS } from "../../constants/status.js";
import { Course, Enrollment, Student } from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { safeRedis } from "../../utils/redisTryCatch.js";
import { validateObjectId } from "../../utils/validateObjectId.js";

export class EnrollmentService {
  static async enrollStudent(payload) {
    const { student, course } = payload;

    validateObjectId(student, "Student ID");
    validateObjectId(course, "Course ID");

    const studentExists = await Student.findById(student);
    if (!studentExists) {
      throw new ApiError(404, "Student not found");
    }

    const courseExists = await Course.findById(course);
    if (!courseExists) {
      throw new ApiError(404, "Course not found");
    }

    const exists = await Enrollment.findOne({ student, course });
    if (exists) {
      throw new ApiError(400, "Already enrolled");
    }

    const enrollment = await Enrollment.create({
      student,
      course,
      status: ENROLLMENT_STATUS.PENDING_PAYMENT,
    });

    await safeRedis(() => redis.del("enrollments:list"));
    await safeRedis(() => redis.del(`enrollments:student:${student}`));
    await safeRedis(() => redis.del(`enrollments:course:${course}`));
    await safeRedis(() => redis.del(`students:courses:${student}`));

    return enrollment;
  }

  static async getEnrollements() {
    const cacheKey = "enrollments:list";
    let cached = null;
    await safeRedis(async () => {
      cached = await redis.get("enrollments:list");
    });

    if (cached) {
      return JSON.parse(cached);
    }
    const enrollments = await Enrollment.find()
      .populate("student", "firstName lastName email")
      .populate("course", "name code")
      .sort({ createdAt: -1 })
      .lean();

    await safeRedis(() =>
      redis.setex(cacheKey, 300, JSON.stringify(enrollments))
    );
    return enrollments;
  }

  static async getEnrollementsByStudent(studentId) {
    validateObjectId(studentId, "Student ID");

    const cacheKey = `enrollments:student:${studentId}`;
    let cached = null;
    await safeRedis(async () => {
      cached = await redis.get(cacheKey);
    });

    if (cached) {
      return JSON.parse(cached);
    }

    const enrollments = await Enrollment.find({ student: studentId })
      .populate("course", "name code semester")
      .sort({ createdAt: -1 })
      .lean();

    await safeRedis(() =>
      redis.setex(cacheKey, 300, JSON.stringify(enrollments))
    );

    return enrollments;
  }

  static async getEnrollementsByCourse(courseId) {
    validateObjectId(courseId, "Course ID");

    const cacheKey = `enrollments:course:${courseId}`;
    let cached = null;
    await safeRedis(async () => {
      cached = await redis.get(cacheKey);
    });

    if (cached) {
      return JSON.parse(cached);
    }

    const enrollments = await Enrollment.find({ course: courseId })
      .populate("student", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    await safeRedis(() =>
      redis.setex(cacheKey, 300, JSON.stringify(enrollments))
    );

    return enrollments;
  }

  static async updateEnrollementStatus(id, status) {
    validateObjectId(id, "Enrollment ID");

    if (
      ![
        ENROLLMENT_STATUS.ENROLLED,
        ENROLLMENT_STATUS.DROPPED,
        ENROLLMENT_STATUS.COMPLETED,
      ].includes(status)
    ) {
      throw new ApiError(400, "Invalid enrollment status");
    }

    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      throw new ApiError(404, "Enrollment not found");
    }

    enrollment.status = status;
    await enrollment.save();

    await safeRedis(() => redis.del("enrollments:list"));
    await safeRedis(() =>
      redis.del(`enrollments:student:${enrollment.student}`)
    );
    await safeRedis(() => redis.del(`enrollments:course:${enrollment.course}`));
    await safeRedis(() => redis.del(`students:courses:${enrollment.student}`))

    return enrollment;
  }
}

//   static async deleteEnrollment(id) {
//     validateObjectId(id, "Enrollment ID");

//     const enrollment = await Enrollment.findByIdAndDelete(id);
//     if (!enrollment) {
//       throw new ApiError(404, "Enrollment not found");
//     }

//     await safeRedis(() => redis.del("enrollments:list"));
//     await safeRedis(() =>
//       redis.del(`enrollments:student:${enrollment.student}`)
//     );
//     await safeRedis(() => redis.del(`enrollments:course:${enrollment.course}`));

//     return enrollment;
//   }
