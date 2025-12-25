import { ApiResponse } from "../../utils/ApiResponse.js";
import { StudentService } from "./student.service.js";

export class StudentController {
  static async createStudent(req, res) {
    const student = await StudentService.createStudent(req.body);
    return res
      .status(201)
      .json(new ApiResponse(201, student, "Student created successfully"));
  }

  static async getAllStudents(req, res) {
    const students = await StudentService.getAllStudents(req.query);
    return res
      .status(200)
      .json(new ApiResponse(200, students, "Students fetched successfully"));
  }

  static async getStudentById(req, res) {
    const { id } = req.params;
    const student = await StudentService.getStudentById(id);
    return res
      .status(200)
      .json(new ApiResponse(200, student, "Student fetched successfully"));
  }

  static async updateStudent(req, res) {
    const { id } = req.params;
    const student = await StudentService.updateStudent(id, req.body);
    return res
      .status(200)
      .json(new ApiResponse(200, student, "Student updated successfully"));
  }

  static async softDeleteStudent(req, res) {
    const { id } = req.params;
    const student = await StudentService.softDeleteStudent(id);
    return res
      .status(200)
      .json(new ApiResponse(200, student, "Student deleted successfully"));
  }

  static async changeStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    const student = await StudentService.changeStatus(id, status);

    return res
      .status(200)
      .json(
        new ApiResponse(200, student, "Student status updated successfully")
      );
  }

  static async getStudentCourses(req, res) {
    const { id } = req.params;
    const courses = await StudentService.getStudentCourses(id);

    return res
      .status(200)
      .json(new ApiResponse(200, courses, "Courses fetched successfully"));
  }

  static async getStudentPayments(req, res) {
    const { id } = req.params;
    const payments = await StudentService.getStudentPayments(id);

    return res
      .status(200)
      .json(
        new ApiResponse(200, payments, "Payment history fetched successfully")
      );
  }

  static async getStudentAttendance(req, res) {
    const { id } = req.params;
    const attendance = await StudentService.getStudentAttendance(id);

    return res
      .status(200)
      .json(
        new ApiResponse(200, attendance, "Attendance fetched successfully")
      );
  }
}
