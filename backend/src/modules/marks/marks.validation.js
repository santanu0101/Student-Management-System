import { z } from "zod";
import mongoose from "mongoose";
import { EXAM_TYPE } from "../../constants/enums.js";

const objectId = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  });

export const addMarksSchema = z.object({
  body: z
    .object({
      studentId: objectId,
      courseId: objectId,

      examType: z.enum(Object.values(EXAM_TYPE), {
        errorMap: () => ({ message: "Invalid exam type" }),
      }),

      score: z.number().min(0, "Score must be >= 0"),

      maxScore: z.number().positive("Max score must be greater than 0"),

      examDate: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
        message: "Invalid exam date",
      }),
    })
    .refine((data) => data.score <= data.maxScore, {
      message: "Score cannot exceed max score",
      path: ["score"],
    }),
});

export const updateMarksSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: z
    .object({
      examType: z.enum(Object.values(EXAM_TYPE)).optional(),

      score: z.number().min(0).optional(),

      maxScore: z.number().positive().optional(),

      examDate: z
        .string()
        .refine((val) => !isNaN(new Date(val).getTime()), {
          message: "Invalid exam date",
        })
        .optional(),
    })
    .refine(
      (data) => {
        if (data.score !== undefined && data.maxScore !== undefined) {
          return data.score <= data.maxScore;
        }
        return true;
      },
      {
        message: "Score cannot exceed max score",
        path: ["score"],
      }
    ),
});

export const marksByStudentSchema = z.object({
  params: z.object({
    studentId: objectId,
  }),
});

export const marksByCourseSchema = z.object({
  params: z.object({
    courseId: objectId,
  }),
});

export const deleteMarksSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const getAllMarksSchema = z.object({
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
