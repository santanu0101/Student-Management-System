import mongoose from "mongoose";
import redis from "../../config/redis.js";
import { ROLES } from "../../constants/roles.js";
import {
  INSTRUCTOR_STATUS,
  INSTRUCTOR_STATUS_TRANSITIONS,
} from "../../constants/status.js";
import { Course } from "../../models/Course.model.js";
import { Instructor } from "../../models/Instructor.model.js";
import { User } from "../../models/User.model.js";
import { STATUS_USER_ACCESS } from "../../rules/instructor.rule.js";
import { ApiError } from "../../utils/ApiError.js";
import { validateObjectId } from "../../utils/validateObjectId.js";

export class InstructorService {
  static async createInstructor(payload) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const exists = await Instructor.findOne({ email: payload.email }).session(
        session
      );
      if (exists) {
        throw new ApiError(400, "Instructor with this email already exists");
      }
      const instructor = await Instructor.create([payload], { session });
      await User.create(
        [
          {
            email: payload.email,
            password: "Instructor@123",
            role: ROLES.INSTRUCTOR,
            instructor: instructor[0]._id,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      await redis.del("instructors:list");

      return instructor;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  static async getAllInstructors() {
    const cacheKey = "instructors:list";
    const cachedInstructors = await redis.get(cacheKey);
    if (cachedInstructors) {
      return JSON.parse(cachedInstructors);
    }
    const instructors = await Instructor.find({ isActive: true })
      .populate("department")
      .sort({ createdAt: -1 })
      .lean();

    await redis.setex(cacheKey, 300, JSON.stringify(instructors));

    return instructors;
  }

  static async getInstructorById(id) {
    validateObjectId(id, "Instructor ID");

    const cacheKey = `instructor:details:${id}`;
    const cachedInstructor = await redis.get(cacheKey);
    if (cachedInstructor) {
      return JSON.parse(cachedInstructor);
    }

    const instructor = await Instructor.findById({ _id: id, isActive: true })
      .populate("department")
      .lean();

    if (!instructor) {
      throw new ApiError(404, "Instructor not found");
    }
    await redis.setex(cacheKey, 300, JSON.stringify(instructor));

    return instructor;
  }

  static async updateInstructor(id, payload) {
    validateObjectId(id, "Instructor ID");
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const instructor = await Instructor.findById(id).session(session);
      if (!instructor) {
        throw new ApiError(404, "Instructor not found");
      }

      if (payload.email && payload.email !== instructor.email) {
        const emailExists = await User.findOne({
          email: payload.email,
        }).session(session);
        if (emailExists) {
          throw new ApiError(400, "Email already in use by another user");
        }
        await User.findOneAndUpdate(
          { instructor: instructor._id },
          { email: payload.email },
          { session }
        );
      }

      Object.assign(instructor, payload);
      await instructor.save({ session });

      await session.commitTransaction();
      session.endSession();

      await redis.del(`instructor:details:${id}`);
      await redis.del("instructors:list");

      return instructor;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  static async changeInstructorStatus(id, status) {
    if (typeof status !== "string") {
      throw new ApiError(400, "Status must be a string");
    }
    status = status.toLowerCase();
    validateObjectId(id, "Instructor ID");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const instructor = await Instructor.findById(id).session(session);
      if (!instructor) {
        throw new ApiError(404, "Instructor not found");
      }

      if (!Object.values(INSTRUCTOR_STATUS).includes(status)) {
        throw new ApiError(400, "Invalid status value");
      }

      if (!INSTRUCTOR_STATUS_TRANSITIONS[instructor.status]?.includes(status)) {
        throw new ApiError(
          400,
          `Cannot change status from ${instructor.status} to ${status}`
        );
      }

      instructor.status = status;
      await instructor.save({ session });

      await User.findOneAndUpdate(
        { instructor: instructor._id },
        { isActive: STATUS_USER_ACCESS[status] },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      await redis.del(`instructor:details:${id}`);
      await redis.del("instructors:list");

      return instructor;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  static async deleteInstructor(id) {
    validateObjectId(id, "Instructor ID");
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const instructor = await Instructor.findById(id).session(session);
      if (!instructor) {
        throw new ApiError(404, "Instructor not found");
      }

      instructor.isActive = false;
      instructor.status = INSTRUCTOR_STATUS.RETIRED;
      await instructor.save({ session });

      await User.findOneAndUpdate(
        { instructor: instructor._id },
        { isActive: false },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      await redis.del(`instructor:details:${id}`);
      const keys = await redis.keys("instructors:list*");
      if (keys.length > 0) {
        await redis.del(keys);
      }

      return instructor;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  static async getInstructorCourses(id) {
    validateObjectId(id, "Instructor ID");
    const cacheKey = `instructor:courses:${id}`;
    const cachedCourses = await redis.get(cacheKey);
    if (cachedCourses) {
      return JSON.parse(cachedCourses);
    }

    const instructor = await Instructor.findOne({
      _id: id,
      isActive: true,
    }).select("_id");
    if (!instructor) {
      throw new ApiError(404, "Instructor not found");
    }

    const courses = await Course.find({ instructor: id, isActive: true })
      .populate("department")
      .sort({ createdAt: -1 })
      .lean();

    await redis.setex(cacheKey, 300, JSON.stringify(courses));

    return courses;
  }
}
