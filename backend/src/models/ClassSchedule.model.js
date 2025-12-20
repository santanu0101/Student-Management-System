import mongoose, { Schema } from "mongoose";

const classScheduleSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    instructor: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      required: true,
    },

    dayOfWeek: {
      type: String,
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    }, // HH:mm

    endTime: {
      type: String,
      required: true,
    },

    room: { type: String },
  },
  { timestamps: true }
);

export const ClassSchedule = mongoose.model(
  "ClassSchedule",
  classScheduleSchema
);
