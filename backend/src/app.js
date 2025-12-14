import express from "express";
import userRoutes from "./routes/User.route.js"

class App {
  constructor() {
    this.app = express();
    this.middleWare();
    this.routes();
  }

  middleWare() {
    this.app.use(express.json());
  }

  routes() {
    this.app.use("/api/user", userRoutes);
  }
  getServer() {
    return this.app;
  }
}

export default new App().getServer();
