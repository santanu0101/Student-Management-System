// src/models/index.js
// Industry-standard, scalable Mongoose models
// Common practices: timestamps, indexes, enums, references, soft-status fields

import mongoose from "mongoose";
const { Schema } = mongoose;

/* =====================
   1. Department
===================== */
const departmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    building: { type: String, trim: true },
    headOfDepartment: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      default: null,
    },
  },
  { timestamps: true }
);

export const Department = mongoose.model("Department", departmentSchema);

/* =====================
   2. Student
===================== */
const studentSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    phone: { type: String, trim: true },
    dob: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    address: { type: String },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    admissionDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["active", "graduated", "suspended"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

export const Student = mongoose.model("Student", studentSchema);

/* =====================
   3. Instructor
===================== */
const instructorSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    hireDate: { type: Date, default: Date.now },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
  },
  { timestamps: true }
);

export const Instructor = mongoose.model("Instructor", instructorSchema);

/* =====================
   4. Course
===================== */
const courseSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String },
    credits: { type: Number, required: true, min: 0 },
    semester: { type: String, required: true },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      required: true,
    },
  },
  { timestamps: true }
);

export const Course = mongoose.model("Course", courseSchema);

/* =====================
   5. Enrollment (M-M)
===================== */
const enrollmentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    enrollmentDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["enrolled", "dropped", "completed"],
      default: "enrolled",
    },
  },
  { timestamps: true }
);

// prevent duplicate enrollment
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

/* =====================
   6. Payment
===================== */
const paymentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    method: { type: String, enum: ["online", "cash", "bank"], required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["paid", "pending", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);

/* =====================
   7. Attendance
===================== */
const attendanceSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["present", "absent", "late"], required: true },
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, course: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);

/* =====================
   8. Marks / Assessment
===================== */
const marksSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    examType: {
      type: String,
      enum: ["mid", "final", "assignment", "quiz"],
      required: true,
    },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    examDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Marks = mongoose.model("Marks", marksSchema);

/* =====================
   9. User (Auth)
===================== */
const userSchema = new Schema(
  {
    role: { type: String, enum: ["admin", "student", "instructor"], required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", default: null },
    instructor: { type: Schema.Types.ObjectId, ref: "Instructor", default: null },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);

/* =====================
   10. Class Schedule
===================== */
const classScheduleSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    instructor: { type: Schema.Types.ObjectId, ref: "Instructor", required: true },
    dayOfWeek: {
      type: String,
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      required: true,
    },
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true },
    room: { type: String },
  },
  { timestamps: true }
);

export const ClassSchedule = mongoose.model("ClassSchedule", classScheduleSchema);

/* =====================
   11. Notification (Optional)
===================== */
const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["read", "unread"], default: "unread" },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
