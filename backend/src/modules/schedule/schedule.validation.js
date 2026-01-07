import { z } from "zod";
import mongoose from "mongoose";
import { DAYS_OF_WEEK } from "../../constants/enums.js";

/* 🔹 Common ObjectId validator */
const objectId = (name = "ID") =>
  z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: `${name} is invalid`,
    });

/* 🔹 Time format HH:mm */
const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format");


export const createScheduleSchema = z.object({
  body: z
    .object({
      course: objectId("Course ID"),
      instructor: objectId("Instructor ID"),
      dayOfWeek: z.enum(Object.values(DAYS_OF_WEEK)),
      startTime: timeSchema,
      endTime: timeSchema,
      room: z.string().optional(),
    })
    .refine(
      (data) => data.startTime < data.endTime,
      {
        message: "Start time must be before end time",
        path: ["startTime"],
      }
    ),
});

export const updateScheduleSchema = z.object({
  params: z.object({
    id: objectId("Schedule ID"),
  }),

  body: z
    .object({
      course: objectId("Course ID").optional(),
      instructor: objectId("Instructor ID").optional(),
      dayOfWeek: z.enum(Object.values(DAYS_OF_WEEK)).optional(),
      startTime: timeSchema.optional(),
      endTime: timeSchema.optional(),
      room: z.string().optional(),
    })
    .refine(
      (data) =>
        !data.startTime ||
        !data.endTime ||
        data.startTime < data.endTime,
      {
        message: "Start time must be before end time",
        path: ["startTime"],
      }
    ),
});

export const getAllSchedulesSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform(Number)
      .refine((v) => !isNaN(v) && v > 0, {
        message: "Page must be a positive number",
      }),
    limit: z
      .string()
      .optional()
      .transform(Number)
      .refine((v) => !isNaN(v) && v > 0, {
        message: "Limit must be a positive number",
      }),
  }),
});

export const getScheduleByCourseSchema = z.object({
  params: z.object({
    courseId: objectId("Course ID"),
  }),
});

export const getScheduleByInstructorSchema = z.object({
  params: z.object({
    instructorId: objectId("Instructor ID"),
  }),
});

export const deleteScheduleSchema = z.object({
  params: z.object({
    id: objectId("Schedule ID"),
  }),
});
