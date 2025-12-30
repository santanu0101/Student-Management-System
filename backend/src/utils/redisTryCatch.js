export async function safeRedis(fn) {
  try {
    return await fn();
  } catch (err) {
    console.error("Redis error:", err.message);
    return null;
  }
}
