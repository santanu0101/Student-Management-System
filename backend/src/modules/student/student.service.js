import mongoose from "mongoose";
import { ROLES } from "../../constants/roles.js";
import { Student } from "../../models/Student.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { User } from "../../models/User.model.js";
import { STUDENT_STATUS } from "../../constants/status.js";
import { Enrollment } from "../../models/Enrollment.model.js";
import { Payment } from "../../models/Payment.model.js";
import { Attendance } from "../../models/Attendance.model.js";
import redis from "../../config/redis.js";
import { STATUS_USER_ACCESS } from "../../rules/student.rule.js";
import { validateObjectId } from "../../utils/validateObjectId.js";

export class StudentService {
  // Create student and corresponding user activation record
  static async createStudent(data) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const exists = await Student.findOne({ email: data.email }).session(
        session
      );
      if (exists) {
        throw new ApiError(409, "Student with this email already exists");
      }
      const student = await Student.create([data], { session });
      await User.create(
        [
          {
            email: data.email,
            password: "Student@123",
            role: ROLES.STUDENT,
            student: student[0]._id,
          },
        ],
        { session }
      );
      await session.commitTransaction();
      session.endSession();

      const keys = await redis.keys("students:list:*");
      if (keys.length > 0) {
        await redis.del(keys);
      }

      return student[0];
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // Get all students with optional filters
  static async getAllStudents(query) {
    const filter = { isActive: true };

    if (query.status) {
      filter.status = query.status.toLowerCase();
    }
    if (query.department) {
      filter.department = query.department;
    }

    const cacheKey = `students:list:${JSON.stringify(filter)}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const students = await Student.find(filter)
      .populate("department", "name")
      .sort({ createdAt: -1 })
      .lean();

    await redis.setex(cacheKey, 300, JSON.stringify(students)); // Cache for 5 minutes

    return students;
  }

  // Get student by ID
  static async getStudentById(id) {
    
    validateObjectId(id, "student id");

    const cachedKey = `students:detail:${id}`;

    const cached = await redis.get(cachedKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const student = await Student.findById(id)
      .populate("department", "name")
      .lean();
    if (!student) {
      throw new ApiError(404, "Student not found");
    }

    await redis.setex(cachedKey, 300, JSON.stringify(student)); // Cache for 5 minutes

    return student;
  }

  // Update student and corresponding user email if changed
  static async updateStudent(id, data) {

    validateObjectId(id, "student id");
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const student = await Student.findById(id).session(session);
      if (!student) {
        throw new ApiError(404, "Student not found");
      }

      if (data.email && data.email !== student.email) {
        const emailExists = await User.findOne({ email: data.email }).session(session);
        if (emailExists) {
          throw new ApiError(409, "Email already in use");
        }

        await User.findOneAndUpdate(
          { student: student._id },
          { email: data.email },
          { session }
        );
      }

      Object.assign(student, data);
      await student.save({ session });

      await session.commitTransaction();
      session.endSession();

      await redis.del(`students:detail:${id}`);
      const keys = await redis.keys("students:list:*");
      if (keys.length > 0) {
        await redis.del(keys);
      }

      return student;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // Soft delete student and corresponding user
  static async softDeleteStudent(id) {

    validateObjectId(id, "student id");
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const student = await Student.findById(id).session(session);
      if (!student) {
        throw new ApiError(404, "Student not found");
      }

      student.isActive = false;
      student.status = STUDENT_STATUS.SUSPENDED;
      await student.save({ session });

      await User.findOneAndUpdate(
        { student: student._id },
        { isActive: false },
        { session }
      );
      await session.commitTransaction();
      session.endSession();

      await redis.del(`students:detail:${id}`);
      const keys = await redis.keys("students:list:*");
      if (keys.length > 0) {
        await redis.del(keys);
      }

      return student;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // Change student status
  static async changeStatus(id, status) {
    status = status.toLowerCase();
    validateObjectId(id, "student id");
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const student = await Student.findById(id).session(session);
      if (!student) {
        throw new ApiError(404, "Student not found");
      }

      if (!Object.values(STUDENT_STATUS).includes(status)) {
        throw new ApiError(400, "Invalid status value");
      }

      student.status = status;
      await student.save({ session });

      await User.findOneAndUpdate(
        { student: student._id },
        { isActive: STATUS_USER_ACCESS[status] },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      await redis.del(`students:detail:${id}`);
      const keys = await redis.keys("students:list:*");
      if (keys.length > 0) {
        await redis.del(keys);
      }

      return student;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // Get courses enrolled by a student
  static async getStudentCourses(studentId) {
    validateObjectId(studentId, "student id");
    const cachedKey = `students:courses:${studentId}`;

    const cached = await redis.get(cachedKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const courses = await Enrollment.find({ student: studentId })
      .populate("course", "name code description semester")
      .lean();
    if (!courses) {
      throw new ApiError(404, "Student not found");
    }

    await redis.setex(cachedKey, 300, JSON.stringify(courses)); // Cache for 5 minutes
    return courses;
  }

  // Get payment history of a student
  static async getStudentPayments(studentId) {
    validateObjectId(studentId, "student id");
    const cachedKey = `students:payments:${studentId}`;

    const cached = await redis.get(cachedKey);
    if (cached) {
      return JSON.parse(cached);
    }
    const paymentHistory = await Payment.find({ student: studentId })
      .sort({
        paymentDate: -1,
      })
      .lean();
    if (!paymentHistory) {
      throw new ApiError(404, "Student not found");
    }

    await redis.setex(cachedKey, 300, JSON.stringify(paymentHistory)); // Cache for 5 minutes
    return paymentHistory;
  }

  // Get attendance records of a student
  static async getStudentAttendance(studentId) {
    validateObjectId(studentId, "student id");
    const cachedKey = `students:attendance:${studentId}`;

    const cached = await redis.get(cachedKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const attendanceRecords = await Attendance.find({ student: studentId })
      .populate("course", "name code")
      .sort({ date: -1 })
      .lean();
    if (!attendanceRecords) {
      throw new ApiError(404, "Student not found");
    }

    await redis.setex(cachedKey, 300, JSON.stringify(attendanceRecords)); // Cache for 5 minutes
    return attendanceRecords;
  }
}
