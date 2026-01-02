import { EnrollmentService } from "./enrollment.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export class EnrollmentController {
  // POST /enrollments
  static async enrollStudent(req, res) {
    const enrollment = await EnrollmentService.enrollStudent(req.body);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "Student enrolled successfully",
          enrollment
        )
      );
  }

  // GET /enrollments
  static async getEnrollments(req, res) {
    const enrollments = await EnrollmentService.getEnrollements();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Enrollments fetched successfully",
          enrollments
        )
      );
  }

  // GET /enrollments/student/:studentId
  static async getEnrollmentsByStudent(req, res) {
    const { studentId } = req.params;

    const enrollments =
      await EnrollmentService.getEnrollementsByStudent(studentId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Student enrollments fetched successfully",
          enrollments
        )
      );
  }

  // GET /enrollments/course/:courseId
  static async getEnrollmentsByCourse(req, res) {
    const { courseId } = req.params;

    const enrollments =
      await EnrollmentService.getEnrollementsByCourse(courseId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Course enrollments fetched successfully",
          enrollments
        )
      );
  }

  // PATCH /enrollments/:id/status
  static async updateEnrollmentStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    const enrollment =
      await EnrollmentService.updateEnrollementStatus(id, status);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Enrollment status updated successfully",
          enrollment
        )
      );
  }
}
