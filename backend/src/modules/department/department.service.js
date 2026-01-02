import mongoose from "mongoose";
import redis from "../../config/redis.js";
import { Department, Instructor } from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { validateObjectId } from "../../utils/validateObjectId.js";
import { safeRedis } from "../../utils/redisTryCatch.js";

export class DepartmentService {
  // Create Department
  static async createDepartment(data) {
    const nameLower = data.name.toLowerCase();

    const existing = await Department.findOne({ nameLower });

    if (existing && existing.isActive) {
      throw new ApiError(409, "Department already exists");
    }

    if (existing && !existing.isActive) {
      existing.isActive = true;
      existing.building = data.building ?? existing.building;
      await existing.save();

      await safeRedis(() =>redis.del("departments:list"));
      return existing;
    }

    const department = await Department.create({
      ...data,
      nameLower,
    });

    await safeRedis(() =>redis.del("departments:list"));

    return department;
  }

  // Get All Departments
  static async getAllDepartments() {
    const cacheKey = "departments:list";

    let cached = null;
    await safeRedis(async () => {
      cached = await redis.get(cacheKey);
    });
    if (cached) {
      return JSON.parse(cached);
    }

    const departments = await Department.find({ isActive: true })
      .populate("headOfDepartment", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    await safeRedis(() => redis.setex(cacheKey, 300, JSON.stringify(departments)));

    return departments;
  }

  // Get Department By ID
  static async getDepartmentById(id) {
    validateObjectId(id, "department id");
    const cacheKey = `departments:${id}`;

    let cached = null;
    await safeRedis(async () => {
      cached = await redis.get(cacheKey);
    });
    if (cached) {
      return JSON.parse(cached);
    }

    const department = await Department.findOne({
      _id: id,
      isActive: true,
    })
      .populate("headOfDepartment", "firstName lastName email")
      .lean();

    if (!department) {
      throw new ApiError(404, "Department not found");
    }

    await safeRedis(() =>redis.setex(cacheKey, 300, JSON.stringify(department)));

    return department;
  }

  // Update Department
  static async updateDepartment(id, data) {
    validateObjectId(id, "department id");

    const department = await Department.findOne({
      _id: id,
      isActive: true,
    });

    if (!department) {
      throw new ApiError(404, "Department not found");
    }

    if (data.name) {
      const nameLower = data.name.toLowerCase();

      const exists = await Department.findOne({
        _id: { $ne: id },
        nameLower: nameLower,
      });

      if (exists) {
        throw new ApiError(409, "Department name already exists");
      }

      data.nameLower = nameLower;
    }

    Object.assign(department, data);
    let updated;
    try {
      updated = await department.save();
    } catch (err) {
      if (err.code === 11000) {
        throw new ApiError(409, "Department name already exists");
      }
      throw err;
    }

    await safeRedis(() => redis.del("departments:list"));
    await safeRedis(() => redis.del(`departments:${id}`));

    return updated;
  }

  // Soft Delete Department
  static async deleteDepartment(id) {
    validateObjectId(id, "department id");

    const department = await Department.findOne({
      _id: id,
      isActive: true,
    });

    if (!department) {
      throw new ApiError(404, "Department not found");
    }

    department.isActive = false;
    await department.save();

    await safeRedis(() =>redis.del("departments:list"));
    await safeRedis(() =>redis.del(`departments:${id}`));

    return department;
  }

  // Assign Head of Department
  static async assignHOD(departmentId, instructorId) {
    validateObjectId(departmentId, "department id");
    validateObjectId(instructorId, "instructor id");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const department = await Department.findOne({
        _id: departmentId,
        isActive: true,
      }).session(session);

      if (!department) {
        throw new ApiError(404, "Department not found");
      }

      const instructor = await Instructor.findById(instructorId).session(
        session
      );
      if (!instructor) {
        throw new ApiError(404, "Instructor not found");
      }

      if (
        instructor.department &&
        instructor.department.toString() !== departmentId
      ) {
        throw new ApiError(400, "Instructor belongs to another department");
      }

      department.headOfDepartment = instructorId;
      await department.save({ session });

      // await Instructor.findByIdAndUpdate(
      //   instructorId,
      //   { role: "HOD" },
      //   { session }
      // );

      // await AuditLog.create(
      //   [{ action: "HOD_ASSIGNED", entityId: departmentId }],
      //   { session }
      // );

      await session.commitTransaction();
      session.endSession();

      await safeRedis(() => redis.del("departments:list"));
      await safeRedis(() => redis.del(`departments:${departmentId}`));

      return department;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

}
