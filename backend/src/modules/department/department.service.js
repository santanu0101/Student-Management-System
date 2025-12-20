import redis from "../../config/redis.js";
import { Department, Instructor } from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";

export class DepartmentService {
  // Create Department
  static async createDepartment(data) {
    const exists = await Department.findOne({
      name: new RegExp(`^${data.name}$`, "i"),
    });

    if (exists) {
      throw new ApiError(409, "Department already exists");
    }

    const department = await Department.create(data);

    await redis.del("departments:list");

    return department;
  }

  // Get All Departments
  static async getAllDepartments() {
    const cacheKey = "departments:list";

    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const departments = await Department.find({ isActive: true })
      .populate("headOfDepartment", "firstName lastName email")
      .sort({ createdAt: -1 });

    await redis.setex(cacheKey, 300, JSON.stringify(departments));

    return departments;
  }

  // Get Department By ID
  static async getDepartmentById(id) {
    const cacheKey = `departments:${id}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const department = await Department.findOne({
      _id: id,
      isActive: true,
    }).populate("headOfDepartment", "firstName lastName email");

    if (!department) {
      throw new ApiError(404, "Department not found");
    }

    await redis.setex(cacheKey, 300, JSON.stringify(department));

    return department;
  }

  // Update Department
  static async updateDepartment(id, data) {
    const department = await Department.findOne({
      _id: id,
      isActive: true,
    });

    if (!department) {
      throw new ApiError(404, "Department not found");
    }

    if (data.name) {
      const exists = await Department.findOne({
        _id: { $ne: id },
        name: new RegExp(`^${data.name}$`, "i"),
      });

      if (exists) {
        throw new ApiError(409, "Department name already exists");
      }
    }

    Object.assign(department, data);
    const updated = await department.save();

    await redis.del("departments:list");
    await redis.del(`departments:${id}`);

    return updated;
  }

  // Soft Delete Department
  static async deleteDepartment(id) {
    const department = await Department.findOne({
      _id: id,
      isActive: true,
    });

    if (!department) {
      throw new ApiError(404, "Department not found");
    }

    department.isActive = false;
    await department.save();

    await redis.del("departments:list");
    await redis.del(`departments:${id}`);

    return department;
  }

  // Assign Head of Department
  static async assignHOD(departmentId, instructorId) {
    const department = await Department.findOne({
      _id: departmentId,
      isActive: true,
    });

    if (!department) {
      throw new ApiError(404, "Department not found");
    }

    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      throw new ApiError(404, "Instructor not found");
    }

    department.headOfDepartment = instructorId;
    await department.save();

    await redis.del("departments:list");
    await redis.del(`departments:${departmentId}`);

    return department;
  }
}
