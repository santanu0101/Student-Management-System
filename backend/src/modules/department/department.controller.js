import { ApiResponse } from "../../utils/ApiResponse.js";
import { DepartmentService } from "./department.service.js";

export class DepartmentController {
  static async create(req, res) {
    const department = await DepartmentService.createDepartment(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(201, department, "Department created successfully")
      );
  }

  static async getAll(req, res) {
    const departments = await DepartmentService.getAllDepartments();
    res
      .status(200)
      .json(
        new ApiResponse(200, departments, "Departments fetched successfully")
      );
  }

  static async getById(req, res) {
    const department = await DepartmentService.getDepartmentById(req.params.id);
    res
      .status(200)
      .json(
        new ApiResponse(200, department, "Department fetched successfully")
      );
  }

  static async update(req, res) {
    const department = await DepartmentService.updateDepartment(
      req.params.id,
      req.body
    );
    res
      .status(200)
      .json(
        new ApiResponse(200, department, "Department updated Successfully")
      );
  }

  static async delete(req, res) {
    const department = await DepartmentService.deleteDepartment(req.params.id);
    res
      .status(200)
      .json(
        new ApiResponse(200, department, "Department deleted Successfully")
      );
  }

  static async assignHOD(req, res) {
    const department = await DepartmentService.assignHOD(
      req.params.id,
      req.body.instructorId
    );
    res
      .status(200)
      .json(new ApiResponse(200, department, "HOD assigned Successfully"));
  }
}
