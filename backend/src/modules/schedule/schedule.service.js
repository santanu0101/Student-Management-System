import mongoose from "mongoose";
import redis from "../../config/redis.js";
import { ClassSchedule, Course, Instructor } from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { validateObjectId } from "../../utils/validateObjectId.js";
import { safeRedis } from "../../utils/redisTryCatch.js";
import { timeToMinutes } from "../../utils/timeToMinute.js";

export class ClassScheduleService {
  static async createSchedule(payload) {
    const { course, instructor, dayOfWeek, startTime, endTime, room } = payload;

    validateObjectId(course, "Course ID");
    validateObjectId(instructor, "Instructor ID");

    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    if (start >= end) {
      throw new ApiError(400, "Start time must be before end time");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const courseExists = await Course.findOne(
        { _id: course, isActive: true },
        null,
        { session }
      );
      if (!courseExists) {
        throw new ApiError(404, "Course not found or inactive");
      }

      if (courseExists.instructor.toString() !== instructor) {
        throw new ApiError(404, "Instructor not assign in this course");
      }

      const instructorExists = await Instructor.findOne(
        { _id: instructor, isActive: true },
        null,
        { session }
      );
      if (!instructorExists) {
        throw new ApiError(404, "Instructor not found or inactive");
      }

      const conflict = await ClassSchedule.findOne(
        {
          dayOfWeek,
          $or: [{ course }, { instructor }],
          $expr: {
            $and: [
              { $lt: [{ $toInt: { $substr: ["$startTime", 0, 2] } }, end] },
              { $gt: [{ $toInt: { $substr: ["$endTime", 0, 2] } }, start] },
            ],
          },
        },
        null,
        { session }
      );

      if (conflict) {
        throw new ApiError(
          409,
          "Schedule conflict detected for course or instructor"
        );
      }

      const schedule = await ClassSchedule.create(
        [
          {
            course,
            instructor,
            dayOfWeek,
            startTime,
            endTime,
            room,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      // 🧹 Cache invalidation
      await safeRedis(() => redis.del("schedules:list"));
      await safeRedis(() => redis.del(`schedules:course:${course}`));
      await safeRedis(() => redis.del(`schedules:instructor:${instructor}`));

      return schedule[0];
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  static async getAllSchedules(query) {
    const { page = 1, limit = 10 } = query;

    const cacheKey = `schedules:list:${page}:${limit}`;
    const cached = await safeRedis(() => redis.get(cacheKey));
    if (cached) return JSON.parse(cached);

    const schedules = await ClassSchedule.find()
      .populate("course", "name code")
      .populate("instructor", "name email")
      .sort({ dayOfWeek: 1, startTime: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    await safeRedis(() =>
      redis.setEx(cacheKey, 300, JSON.stringify(schedules))
    );

    return schedules;
  }

  static async getScheduleByCourse(courseId) {
    validateObjectId(courseId, "Course ID");

    const cacheKey = `schedules:course:${courseId}`;
    const cached = await safeRedis(() => redis.get(cacheKey));
    if (cached) return JSON.parse(cached);

    const schedules = await ClassSchedule.find({ course: courseId })
      .populate("instructor", "name email")
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean();

    await safeRedis(() =>
      redis.setEx(cacheKey, 300, JSON.stringify(schedules))
    );

    return schedules;
  }

  static async getScheduleByInstructor(instructorId) {
    validateObjectId(instructorId, "Instructor ID");

    const cacheKey = `schedules:instructor:${instructorId}`;
    const cached = await safeRedis(() => redis.get(cacheKey));
    if (cached) return JSON.parse(cached);

    const schedules = await ClassSchedule.find({ instructor: instructorId })
      .populate("course", "name code")
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean();

    await safeRedis(() =>
      redis.setEx(cacheKey, 300, JSON.stringify(schedules))
    );

    return schedules;
  }

  static async updateSchedule(id, payload) {
    const { course, instructor, dayOfWeek, startTime, endTime, room } = payload;
    validateObjectId(id, "Schedule ID");

    let start, end;
    if (startTime && endTime) {
      const start = timeToMinutes(startTime);
      const end = timeToMinutes(endTime);
      if (start >= end) {
        throw new ApiError(400, "Start time must be before end time");
      }
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const schedule = await ClassSchedule.findById(id).session(session);
      if (!schedule) {
        throw new ApiError(404, "Schedule not found");
      }

      let courseExists;
      if (course) {
        const courseId = course || schedule.course;
        courseExists = await Course.findOne(
          { _id: courseId, isActive: true },
          null,
          { session }
        );
        if (!courseExists) {
          throw new ApiError(404, "Course not found or inactive");
        }
      }

      if (instructor && courseExists.instructor.toString() !== instructor) {
        throw new ApiError(400, "Instructor not assigned to this course");
      }

      if (instructor) {
        const instructorExists = await Instructor.findOne(
          { _id: instructor, isActive: true },
          null,
          { session }
        );
        if (!instructorExists) {
          throw new ApiError(404, "Instructor not found or inactive");
        }
      }

      const conflict = await ClassSchedule.findOne(
        {
          _id: { $ne: id },
          dayOfWeek,
          $or: [{ course }, { instructor }],
          $expr: {
            $and: [
              { $lt: [{ $toInt: { $substr: ["$startTime", 0, 2] } }, end] },
              { $gt: [{ $toInt: { $substr: ["$endTime", 0, 2] } }, start] },
            ],
          },
        },
        null,
        { session }
      );

      if (conflict) {
        throw new ApiError(
          409,
          "Schedule conflict detected for course or instructor"
        );
      }

      Object.assign(schedule, payload);
      await schedule.save();

      await session.commitTransaction();
      session.endSession();

      await safeRedis(() => redis.del("schedules:list"));
      await safeRedis(() => redis.del(`schedules:course:${schedule.course}`));
      await safeRedis(() =>
        redis.del(`schedules:instructor:${schedule.instructor}`)
      );

      return schedule;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  static async deleteSchedule(id) {
    validateObjectId(id, "Schedule ID");

    const schedule = await ClassSchedule.findByIdAndDelete(id);
    if (!schedule) {
      throw new ApiError(404, "Schedule not found");
    }

    await safeRedis(() => redis.del("schedules:list"));
    await safeRedis(() => redis.del(`schedules:course:${schedule.course}`));
    await safeRedis(() =>
      redis.del(`schedules:instructor:${schedule.instructor}`)
    );

    return { success: true };
  }
}
