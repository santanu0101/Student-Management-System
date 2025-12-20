import { User } from "../../models/User.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";
import redis from "../../config/redis.js";
import { ApiError } from "../../utils/ApiError.js";

export class AuthService {
  //register
  static async register(data) {
    try {
      const { email, password, role, studentId, instructorId } = data;

      const existingUser = await User.findOne({ email });
      if (existingUser) throw new ApiError(409, "User already exists");

      const user = await User.create({
        role: role,
        email: email,
        password: password,
        student: studentId || null,
        instructor: instructorId || null,
      });

      return user;
    } catch (error) {
      console.error(error);
    }
  }

  //login
  static async login(data) {
    const { email, password } = data;
    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new ApiError(401, "Invalid credentials");

    const match = await user.isPasswordCorrect(password);
    // console.log(match)
    if (!match) throw new ApiError(401, "Invalid credentials is");

    const payload = { userId: user._id, role: user.role };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ userId: user._id });

    await redis.set(
      `refresh:${user._id}`,
      refreshToken,
      "EX",
      7 * 24 * 60 * 60
    );

    return { accessToken, refreshToken, role: user.role };
  }

  //refresh token verify and accesstoken generate
  static async refreshToken(oldRefreshToken) {
    const decoded = verifyRefreshToken(oldRefreshToken);

    const key = `refresh:${decoded.userId}`;
    const storedToken = await redis.get(key);

    if (!storedToken || storedToken !== oldRefreshToken) {
      await redis.del(key);
      throw new ApiError(401, "Refresh token reuse detected");
    }

    const user = await User.findById(decoded.userId);
    if (!user) throw new ApiError(401, "User not found");

    const newAccessToken = generateAccessToken({
      userId: user._id,
      role: user.role,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user._id,
    });

    await redis.set(key, newRefreshToken, "EX", 7 * 24 * 60 * 60);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  // logout
  static async logout(userId) {
    await redis.del(`refresh:${userId}`);
  }

  //change Password
  static async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId).select("+password");
    if (!user) throw new ApiError(404, "User not found");

    const match = await user.isPasswordCorrect(oldPassword);
    if (!match) throw new ApiError(400, "User not found");

    user.password = newPassword;
    await user.save();
  }
}
