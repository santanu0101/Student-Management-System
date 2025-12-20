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

    return Department.create(data);
  }

  // Get All Departments
  static async getAllDepartments() {
    return Department.find({ isActive: true })
      .populate("headOfDepartment", "firstName lastName email")
      .sort({ createdAt: -1 });
  }

  // Get Department By ID
  static async getDepartmentById(id) {
    const department = await Department.findOne({
      _id: id,
      isActive: true,
    }).populate("headOfDepartment", "firstName lastName email");

    if (!department) {
      throw new ApiError(404, "Department not found");
    }

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
    return department.save();
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
    return department.save();
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
    return department.save();
  }
}
