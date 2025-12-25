import { ApiResponse } from "../../utils/ApiResponse.js";
import { AuthService } from "./auth.service.js";


export class AuthController {
  //register
  static async register(req, res) {
    const user = await AuthService.register(req.body);
    res
      .status(201)
      .json(new ApiResponse(201, user, "User register successfully"));
  }

  //login
  static async login(req, res) {
    const data = await AuthService.login(req.body);
    res.status(200).json(new ApiResponse(200, data, "Login successful"));
  }

  //refresh
  static async refresh(req, res) {
    const data = await AuthService.refreshToken(req.body.refreshToken, req.body.tokenId);
    res.status(200).json(new ApiResponse(200, data, "Token refreshed"));
  }

  //me
  static async me(req, res) {
    res.status(200).json(
      new ApiResponse(200, {
        userId: req.user.userId,
        role: req.user.role,
      })
    );
  }

  //logout
  static async logout(req, res) {
    await AuthService.logout(req.user.userId);
    res.status(200).json(new ApiResponse(200, null, "Logged out"));
  }

  //changePassword
  static async changePassword(req, res) {
    await AuthService.changePassword(
      req.user.userId,
      req.body.oldPassword,
      req.body.newPassword
    );
    res.status(200).json(new ApiResponse(200, null, "Password changed"));
  }
}
