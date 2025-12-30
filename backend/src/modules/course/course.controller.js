import { ApiResponse } from "../../utils/ApiResponse.js";
import { CourseService } from "./course.service.js";

export class CourseController {
  static async createCourse(req, res) {
    const course = await CourseService.createCourse(req.body);
    res
      .status(201)
      .json(new ApiResponse(201, "Course created successfully", course));
  }

  static async getAllCourses(req, res) {
    const courses = await CourseService.getAllCourses();
    res
      .status(200)
      .json(new ApiResponse(200, "Courses fetched successfully", courses));
  }

  static async getCourseById(req, res) {
    const course = await CourseService.getCourseById(req.params.id);
    res
      .status(200)
      .json(new ApiResponse(200, "Course fetched successfully", course));
  }

  static async updateCourse(req, res) {
    const course = await CourseService.updateCourse(req.params.id, req.body);
    res
      .status(200)
      .json(new ApiResponse(200, "Course updated successfully", course));
  }

  static async deleteCourse(req, res) {
    const course = await CourseService.deleteCourse(req.params.id);
    res
      .status(200)
      .json(new ApiResponse(200, "Course deleted successfully", course));
  }

  static async assignInstructor(req, res) {
    const course = await CourseService.assignInstructor(
      req.params.id,
      req.body.instructor
    );
    res
      .status(200)
      .json(new ApiResponse(200, "Instructor assigned successfully", course));
  }

  static async getEnrolledStudents(req, res) {
    const students = await CourseService.getEnrolledStudents(req.params.id);
    res
      .status(200)
      .json(
        new ApiResponse(200, "Enrolled students fetched successfully", students)
      );
  }
}
