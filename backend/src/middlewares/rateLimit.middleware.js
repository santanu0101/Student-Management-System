import { createRateLimit } from "../config/rateLimit.js";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";

export const loginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) => {
    return `ip:${ipKeyGenerator(req.ip)}`
  },

  handler: (_, res) => {
    return res
      .status(429)
      .json(
        new ApiError(
          429,
          null,
          "Too many login attempts from this IP. Try again later."
        )
      );
  },
});

export const securityRateLimiter = createRateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  defaultMax: 5,

  roleLimits: {
    student: 5,
    instructor: 5,
    admin: 5,
  },

  message: "Too many password change attempts. Try again later.",
});

export const actionRateLimiter = createRateLimit({
  windowMs: 60 * 1000,
  defaultMax: 10,
  roleLimits: {
    student: 10,
    instructor: 25,
    admin: 50,
  },
  message: "Rate limit exceeded. Slow down.",
});

export const adminHeavyRateLimiter = createRateLimit({
  windowMs: 60 * 1000,
  defaultMax: 20,
  roleLimits: {
    admin: 100,
  },
  message: "Admin rate limit exceeded.",
});
