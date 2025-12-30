import { createRateLimit } from "../config/rateLimit.js";


export const loginRateLimiter = createRateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many login attempts from this IP, please try again after 10 minutes.",
  keyType: "IP",
})


export const studentActionRateLimiter = createRateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: "Slow down! Too many actions.",
  keyType: "USER",
})

export const adminRateLimiter = createRateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: "Admin rate limit exceeded.",
  keyType: "USER", 
})
