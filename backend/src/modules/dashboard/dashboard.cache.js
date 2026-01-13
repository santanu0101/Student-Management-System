import redis from "../../config/redis.js";

export const getCachedDashboard = async (key) => {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
};

export const setCachedDashboard = async (key, data, ttl) => {
  await redis.set(key, JSON.stringify(data), "EX", ttl);
};
