import express from "express";
import swaggerUi from "swagger-ui-express";

import userRoutes from "./routes/index.js"
import errorMiddleware from "./middlewares/error.middleware.js";
import { swaggerSpec } from "./config/swagger.js";

class App {
  constructor() {
    this.app = express();
    this.middleWare();
    this.routes();
    this.errorHandler();
  }

  middleWare() {
    this.app.use(express.json());
  }

  routes() {
    this.app.use("/api/v1", userRoutes);
    this.app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec)
    );
  }

  errorHandler() {
    this.app.use(errorMiddleware);
  }

  getServer() {
    return this.app;
  }
}

export default new App().getServer();
