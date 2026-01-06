import { AttendanceService } from "./attendance.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const markAttendance = async (req, res) => {
  const attendance = await AttendanceService.markAttendance(req.body);

  res
    .status(201)
    .json(new ApiResponse(201, attendance, "Attendance marked successfully"));
};

export const getAttendance = async (req, res) => {
  const attendance = await AttendanceService.getAttendance(req.query);

  res
    .status(200)
    .json(new ApiResponse(200, attendance, "Attendance fetched successfully"));
};

export const getAttendanceByStudent = async (req, res) => {
  const attendance = await AttendanceService.getAttendanceByStudent(
    req.params.studentId
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        attendance,
        "Student attendance fetched successfully"
      )
    );
};

export const getAttendanceByCourse = async (req, res) => {
  const attendance = await AttendanceService.getAttendanceByCourse(
    req.params.courseId
  );

  res
    .status(200)
    .json(
      new ApiResponse(200, attendance, "Course attendance fetched successfully")
    );
};

export const updateAttendance = async (req, res) => {
  const attendance = await AttendanceService.updateAttendance(
    req.params.id,
    req.body
  );

  res
    .status(200)
    .json(new ApiResponse(200, attendance, "Attendance updated successfully"));
};

export const deleteAttendance = async (req, res) => {
  await AttendanceService.deleteAttendance(req.params.id);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Attendance deleted successfully"));
};

export const getAttendancePercentage = async (req, res) => {
  const { studentId } = req.params;
  const { courseId } = req.query;

  const percentage = await AttendanceService.getAttendancePercentage(
    studentId,
    courseId
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        percentage,
        "Attendance percentage fetched successfully"
      )
    );
};
