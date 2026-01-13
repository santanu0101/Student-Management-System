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
    const { accessToken, refreshToken, tokenId, role } =
      await AuthService.login(req.body);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true, // true in production
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          accessToken,
          tokenId,
          role,
        },
        "Login successful"
      )
    );
  }

  //refresh
  static async refresh(req, res) {
    const refreshToken = req.cookies?.refreshToken;
    const { tokenId } = req.body;

    if (!refreshToken) {
      throw new ApiError(401, "Refresh token missing");
    }

    const data = await AuthService.refreshToken(refreshToken, tokenId);

    // rotate refresh token in cookie
    res.cookie("refreshToken", data.refreshToken, {
      httpOnly: true,
      secure: true, 
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { accessToken: data.accessToken },
          "Token refreshed"
        )
      );
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
    const userId = req.user.id;
    const { tokenId } = req.body;

    if (!tokenId) {
      throw new ApiError(400, "Token ID required");
    }

    await AuthService.logout(userId, tokenId);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  }

  static async logoutAll(req, res) {
    await AuthService.logoutAll(req.user.userId);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Logged out from all devices"));
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
