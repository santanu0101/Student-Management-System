import { ApiResponse } from "../../utils/ApiResponse.js";
import { InstructorService } from "./instructor.service.js";

export class InstructorController {
  static async createInstructor(req, res) {
    const instructor = await InstructorService.createInstructor(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(201, "Instructor created successfully", instructor)
      );
  }

  static async getAllInstructors(_, res) {
    const instructors = await InstructorService.getAllInstructors();
    res
      .status(200)
      .json(
        new ApiResponse(200, "Instructor fetched successfully", instructors)
      );
  }

  static async getInstructorById(req, res) {
    const { id } = req.params;
    const instructor = await InstructorService.getInstructorById(id);
    res
      .status(200)
      .json(
        new ApiResponse(200, "Instructor fetched successfully", instructor)
      );
  }

  static async updateInstructorStatus(req, res) {
    const { id } = req.params;

    const instructor = await InstructorService.updateInstructor(
      id,
      req.body
    );
    res
      .status(200)
      .json(
        new ApiResponse(200, "Instructor updated successfully", instructor)
      );
  }

  static async changeInstructorStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    const instructor = await InstructorService.changeInstructorStatus(
      id,
      status
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Instructor status changed successfully",
          instructor
        )
      );
  }

  static async deleteInstructor(req, res) {
    const { id } = req.params;

    const instructor = await InstructorService.deleteInstructor(id);

    res
      .status(200)
      .json(
        new ApiResponse(200, "Instructor deleted successfully", instructor)
      );
  }

  static async getInstructorCourses(req, res) {
    const { id } = req.params;

    const courses = await InstructorService.getInstructorCourses(id);

    res
      .status(200)
      .json(
        new ApiResponse(200, "Instructor courses fetched successfully", courses)
      );
  }
}
