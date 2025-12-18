import redis from "../config/redis.js";
import { ApiError } from "../utils/ApiError.js";

export const loginRateLimiter = async (req, res, next) => {
  const ip = req.ip;
  const key = `login_attempt:${ip}`;

  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, 60 * 5);
  }

  if (attempts > 5) {
    throw new ApiError(
      429,
      "Too many login attempts. Try again after 5 minutes."
    );
  }

  next();
};
