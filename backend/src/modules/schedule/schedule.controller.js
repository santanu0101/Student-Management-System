import { ClassScheduleService } from "./schedule.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export class ClassScheduleController {
  static async createSchedule(req, res, next) {
    try {
      const schedule = await ClassScheduleService.createSchedule(req.body);

      return res
        .status(201)
        .json(
          new ApiResponse(201, schedule, "Class schedule created successfully")
        );
    } catch (error) {
      next(error);
    }
  }

  static async getAllSchedules(req, res, next) {
    try {
      const schedules = await ClassScheduleService.getAllSchedules(req.query);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            schedules,
            "Class schedules fetched successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  static async getScheduleByCourse(req, res, next) {
    try {
      const schedules = await ClassScheduleService.getScheduleByCourse(
        req.params.courseId
      );

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            schedules,
            "Course schedules fetched successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  static async getScheduleByInstructor(req, res, next) {
    try {
      const schedules = await ClassScheduleService.getScheduleByInstructor(
        req.params.instructorId
      );

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            schedules,
            "Instructor schedules fetched successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  static async updateSchedule(req, res, next) {
    try {
      const schedule = await ClassScheduleService.updateSchedule(
        req.params.id,
        req.body
      );

      return res
        .status(200)
        .json(
          new ApiResponse(200, schedule, "Class schedule updated successfully")
        );
    } catch (error) {
      next(error);
    }
  }

  static async deleteSchedule(req, res, next) {
    try {
      await ClassScheduleService.deleteSchedule(req.params.id);

      return res
        .status(200)
        .json(
          new ApiResponse(200, null, "Class schedule deleted successfully")
        );
    } catch (error) {
      next(error);
    }
  }
}
