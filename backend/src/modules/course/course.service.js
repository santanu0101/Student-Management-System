import redis from "../../config/redis.js";
import { ENROLLMENT_STATUS } from "../../constants/status.js";
import { Enrollment, Instructor, Course } from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { safeRedis } from "../../utils/redisTryCatch.js";
import { validateObjectId } from "../../utils/validateObjectId.js";

export class CourseService {
  static async createCourse(payload) {
    payload.code = payload.code.toUpperCase();

    const exists = await Course.findOne({ code: payload.code });
    if (exists && exists.isActive) {
      throw new ApiError(400, "Course with this code already exists");
    }

    if (exists && !exists.isActive) {
      Object.assign(exists, payload, { isActive: true });
      await exists.save();

      await safeRedis(() => redis.del("courses:list"));
      await safeRedis(() => redis.del(`courses:detail:${exists._id}`));

      return exists;
    }
    const course = await Course.create({ ...payload, isActive: true });

    await safeRedis(() => redis.del("courses:list"));

    return course;
  }

  static async getAllCourses() {
    const cacheKey = "courses:list";
    let cached = null;
    await safeRedis(async () => {
      cached = await redis.get(cacheKey);
    });
    if (cached) {
      return JSON.parse(cached);
    }
    const courses = await Course.find({ isActive: true })
      .populate("department", "name")
      .populate("instructor", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    await safeRedis(() => redis.setex(cacheKey, 300, JSON.stringify(courses)));
    return courses;
  }

  static async getCourseById(id) {
    validateObjectId(id, "course id");

    const cacheKey = `courses:detail:${id}`;
    let cached = null;
    await safeRedis(async () => {
      cached = await redis.get(cacheKey);
    });
    if (cached) {
      return JSON.parse(cached);
    }

    const course = await Course.findOne({ _id: id, isActive: true })
      .populate("department", "name")
      .populate("instructor", "firstName lastName email")
      .lean();

    if (!course) {
      throw new ApiError(404, "Course not found");
    }
    await safeRedis(() => redis.setex(cacheKey, 300, JSON.stringify(course)));
    return course;
  }

  static async updateCourse(id, payload) {
    validateObjectId(id, "course id");

    if (payload.code) {
      payload.code = payload.code.toUpperCase();
      const exists = await Course.findOne({
        code: payload.code,
        _id: { $ne: id },
      }); // Exclude current course

      if (exists) {
        throw new ApiError(400, "Course with this code already exists");
      }
    }
    const course = await Course.findOne({ _id: id, isActive: true });
    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    Object.assign(course, payload);
    await course.save();

    await safeRedis(() => redis.del(`courses:detail:${id}`));
    await safeRedis(() => redis.del("courses:list"));

    return course;
  }

  static async deleteCourse(id) {
    validateObjectId(id, "course id");

    const hasEnrollments = await Enrollment.exists({
      course: id,
      status: ENROLLMENT_STATUS.ENROLLED,
    });
    if (hasEnrollments) {
      throw new ApiError(400, "Cannot delete course with enrolled students");
    }

    const course = await Course.findOne({
      _id: id,
      isActive: true,
    });

    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    course.isActive = false;
    await course.save();

    await safeRedis(() => redis.del(`courses:detail:${id}`));
    await safeRedis(() => redis.del("courses:list"));

    return course;
  }

  static async assignInstructor(courseId, instructorId) {
    validateObjectId(courseId, "course id");
    validateObjectId(instructorId, "instructor id");

    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      throw new ApiError(404, "Instructor not found");
    }
    const course = await Course.findOne({ _id: id, isActive: true });
    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    if (course.instructor && course.instructor.toString() === instructorId) {
      return course;
    }

    course.instructor = instructorId;
    await course.save();

    await safeRedis(() => redis.del(`courses:detail:${courseId}`));
    await safeRedis(() => redis.del("courses:list"));

    return course;
  }

  static async getEnrolledStudents(courseId) {
    validateObjectId(courseId, "course id");

    const enrollments = await Enrollment.find({
      course: courseId,
      status: ENROLLMENT_STATUS.ENROLLED,
    })
      .populate("student", "firstName lastName email")
      .lean();

    return enrollments;
  }
}
