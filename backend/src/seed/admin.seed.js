import "../config/env.js";
import bcrypt from "bcrypt";
import { User } from "../models/index.js";
import db from "../config/db.js";

const seedAdmin = async () => {
  await db.connect();

  const adminEmail = "admin@college.com";

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (existingAdmin) {
    console.log("Admin already exists");
    process.exit(0);
  }

  const password = "Admin@123";

  await User.create({
    email: adminEmail,
    password,
    role: "admin",
  });

  console.log("✅ Admin created successfully");
  process.exit(0);
};

seedAdmin();
