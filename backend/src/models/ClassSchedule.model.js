import mongoose, { Schema } from "mongoose";
import { DAYS_OF_WEEK } from "../constants/enums.js";

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
      enum: Object.values(DAYS_OF_WEEK),
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
