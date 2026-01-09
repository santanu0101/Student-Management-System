import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redis from "../config/redis.js";
import { ApiError } from "../utils/ApiError.js";

export const createRateLimit = ({
  windowMs,
  defaultMax,
  roleLimits,
  message,
}) => {
  return rateLimit({
    windowMs,
    standardHeaders: true,
    legacyHeaders: false,

    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
    }),

    keyGenerator: (req) => {
      if (req.user?.id) {
        console.log(`user:${req.user.id}`);
        return `user:${req.user.id}`;
      }
      return `ip:${ipKeyGenerator(req.ip)}`;
    },

    max: (req) => {
      const role = req.user.role;
      return roleLimits?.[role] ?? defaultMax;
    },

    handler: (_, res) => {
      return res.status(429).json(new ApiError(429, null, message));
    },
  });
};
