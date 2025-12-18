import express from "express";
import userRoutes from "./routes/index.js"
import errorMiddleware from "./middlewares/error.middleware.js";

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
  }

  errorHandler() {
    this.app.use(errorMiddleware);
  }

  getServer() {
    return this.app;
  }
}

export default new App().getServer();
