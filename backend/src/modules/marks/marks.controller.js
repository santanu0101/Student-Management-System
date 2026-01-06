import asyncHandler from "../../utils/asyncHandler.js";
import { MarksService } from "./marks.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export class MarksController {
  static async addMarks(req, res) {
    const marks = await MarksService.addMarks(req.body);

    return res
      .status(201)
      .json(new ApiResponse(201, marks, "Marks added successfully"));
  }

  static async getAllMarks(req, res) {
    const marks = await MarksService.getAllMarks(req.query);

    return res
      .status(200)
      .json(new ApiResponse(200, marks, "Marks fetched successfully"));
  }

  static async getMarksByStudent(req, res) {
    const { studentId } = req.params;

    const marks = await MarksService.getMarksByStudent(studentId);

    return res
      .status(200)
      .json(new ApiResponse(200, marks, "Student marks fetched successfully"));
  }

  static async getMarksByCourse(req, res) {
    const { courseId } = req.params;

    const marks = await MarksService.getMarksByCourse(courseId);

    return res
      .status(200)
      .json(new ApiResponse(200, marks, "Course marks fetched successfully"));
  }

  static async updateMarks(req, res) {
    const { id } = req.params;

    const marks = await MarksService.updateMarks(id, req.body);

    return res
      .status(200)
      .json(new ApiResponse(200, marks, "Marks updated successfully"));
  }

  static async deleteMarks(req, res) {
    const { id } = req.params;

    const result = await MarksService.deleteMarks(id);

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Marks deleted successfully"));
  }
}
