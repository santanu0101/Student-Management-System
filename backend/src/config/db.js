
import mongoose from "mongoose";

class Database {
  async connect() {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB connected");

      mongoose.connection.once("open", async () => {
        const admin = mongoose.connection.db.admin();
        const info = await admin.command({ hello: 1 });

        console.log("Replica Set:", info.setName || "Not a replica set");
      });

    } catch (error) {
      console.error("MongoDB connection failed", error.message);
      process.exit(1);
    }
  }
}

export default new Database();
