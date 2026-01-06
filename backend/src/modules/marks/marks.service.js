import mongoose from "mongoose";
import redis from "../../config/redis.js";
import { Course, Enrollment, Marks, Student } from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { validateObjectId } from "../../utils/validateObjectId.js";
import { safeRedis } from "../../utils/redisTryCatch.js";
import { ENROLLMENT_STATUS } from "../../constants/status.js";

export class MarksService {
  static async addMarks(payload) {
    const { studentId, courseId, examType, score, maxScore, examDate } =
      payload;

    validateObjectId(studentId, "Student ID");
    validateObjectId(courseId, "Course ID");

    if (score > maxScore) {
      throw new ApiError(400, "Score cannot exceed max score");
    }

    const examDateObj = new Date(examDate);
    if (isNaN(examDateObj)) {
      throw new ApiError(400, "Invalid exam date");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const studentExists = await Student.findOne(
        { _id: studentId, isActive: true },
        null,
        { session }
      );

      if (!studentExists) {
        throw new ApiError(404, "Student not found");
      }

      const courseExists = await Course.findOne(
        {
          _id: courseId,
          isActive: true,
        },
        null,
        { session }
      );

      if (!courseExists) {
        throw new ApiError(404, "Course not found or inactive");
      }

      const enrollment = await Enrollment.exists(
        {
          student: studentId,
          course: courseId,
          status: ENROLLMENT_STATUS.ENROLLED,
        },
        null,
        { session }
      );

      if (!enrollment) {
        throw new ApiError(403, "Student is not enrolled in this course");
      }

      const marks = await Marks.create(
        [
          {
            student: studentId,
            course: courseId,
            examType,
            score,
            maxScore,
            examDate: examDateObj,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      await safeRedis(async () => {
        const keys = await redis.keys("marks:list:*");
        if (keys.length) await redis.del(keys);
      });
      await safeRedis(() => redis.del(`marks:student:${studentId}`));
      await safeRedis(() => redis.del(`marks:course:${courseId}`));

      const [marksDoc] = marks;
      return marksDoc;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      if (error.code === 11000) {
        throw new ApiError(409, "Marks already added for this exam");
      }

      throw error;
    }
  }

  static async getAllMarks(query) {
    const { page = 1, limit = 10 } = query;

    const cacheKey = `marks:list:${page}:${limit}`;
    const cached = await safeRedis(() => redis.get(cacheKey));
    if (cached) return JSON.parse(cached);

    const marks = await Marks.find()
      .populate("student", "name email")
      .populate("course", "name code")
      .sort({ examDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    await safeRedis(() => redis.setex(cacheKey, 300, JSON.stringify(marks)));

    return marks;
  }

  static async getMarksByStudent(studentId) {
    validateObjectId(studentId, "Student ID");

    const cacheKey = `marks:student:${studentId}`;
    const cached = await safeRedis(() => redis.get(cacheKey));
    if (cached) return JSON.parse(cached);

    const marks = await Marks.find({ student: studentId })
      .populate("course", "name code")
      .sort({ examDate: -1 })
      .lean();

    await safeRedis(() => redis.setex(cacheKey, 300, JSON.stringify(marks)));

    return marks;
  }

  static async getMarksByCourse(courseId) {
    validateObjectId(courseId, "Course ID");

    const cacheKey = `marks:course:${courseId}`;
    const cached = await safeRedis(() => redis.get(cacheKey));
    if (cached) return JSON.parse(cached);

    const marks = await Marks.find({ course: courseId })
      .populate("student", "name email")
      .sort({ examDate: -1 })
      .lean();

    await safeRedis(() => redis.setex(cacheKey, 300, JSON.stringify(marks)));

    return marks;
  }

  static async updateMarks(id, payload) {
    validateObjectId(id, "Marks ID");

    const marks = await Marks.findById(id);
    if (!marks) {
      throw new ApiError(404, "Marks record not found");
    }

    if (payload.score !== undefined) {
      if (payload.score > (payload.maxScore ?? marks.maxScore)) {
        throw new ApiError(400, "Score cannot exceed max score");
      }
      marks.score = payload.score;
    }

    if (payload.maxScore !== undefined) {
      if (marks.score > payload.maxScore) {
        throw new ApiError(400, "Score cannot exceed max score");
      }
      marks.maxScore = payload.maxScore;
    }

    if (payload.examDate) {
      const examDateObj = new Date(payload.examDate);
      if (isNaN(examDateObj)) {
        throw new ApiError(400, "Invalid exam date");
      }

      marks.examDate = examDateObj;
    }
    if (payload.examType) marks.examType = payload.examType;

    await marks.save();

    await safeRedis(async () => {
      const keys = await redis.keys("marks:list:*");
      if (keys.length) await redis.del(keys);
    });
    await safeRedis(() => redis.del(`marks:student:${marks.student}`));
    await safeRedis(() => redis.del(`marks:course:${marks.course}`));

    return marks;
  }

  static async deleteMarks(id) {
    validateObjectId(id, "Marks ID");

    const marks = await Marks.findByIdAndDelete(id);
    if (!marks) {
      throw new ApiError(404, "Marks record not found");
    }

    await safeRedis(async () => {
      const keys = await redis.keys("marks:list:*");
      if (keys.length) await redis.del(keys);
    });
    await safeRedis(() => redis.del(`marks:student:${marks.student}`));
    await safeRedis(() => redis.del(`marks:course:${marks.course}`));

    return { success: true };
  }
}
