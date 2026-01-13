import cors from "cors";

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://your-frontend.com",
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // allow requests with no origin (mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // cookies, auth headers
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["X-Total-Count"],
  maxAge: 600, // cache preflight for 10 min
});

export default corsMiddleware;
