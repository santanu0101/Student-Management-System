import rateLimit, { ipKeyGenerator }  from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redis from "../config/redis.js";
import { ApiError } from "../utils/ApiError.js";

export const createRateLimit = ({
  windowMs,
  max,
  message,
  keyType = "USER",
}) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,

    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
    }),

    keyGenerator: (req) => {
        // console.log(ipKeyGenerator(req));
      if (keyType === "USER" && req.user?.id) {
        return `user:${req.user.id}`;
      }
      return `ip:${ipKeyGenerator(req)}`;
    },

    handler: (req, res) => {
      return res.status(429).json(new ApiError(429, null, message));
    },
  });
};
