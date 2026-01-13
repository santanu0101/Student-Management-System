import { ApiResponse } from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { DashboardService } from "./dashboard.service.js";

export class DashboardController {
  static adminDashboard = asyncHandler(async (req, res) => {
    const data = await DashboardService.adminDashboard();
    res.status(200).json(new ApiResponse(200, data, "data fetch successfully"));
  });

  static instructorDashboard = asyncHandler(async (req, res) => {
    const data = await DashboardService.instructorDashboard(req.user.id);
    res.status(200).json(new ApiResponse(200, data, "data fetch successfully"));
  });

  static studentDashboard = asyncHandler(async (req, res) => {
    const data = await DashboardService.studentDashboard(req.user.id);
    res.status(200).json(new ApiResponse(200, data, "data fetch successfully"));
  });
}
