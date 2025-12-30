import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const createCourseSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    code: z.string().min(3).toUpperCase(),
    description: z.string().optional(),
    credits: z.number().min(0),
    semester: z.string(),
    department: objectId,
    instructor: objectId,
  }),
});

export const updateCourseSchema = z.object({
  body: z
    .object({
      name: z.string().min(3).optional(),
      description: z.string().optional(),
      credits: z.number().min(0).optional(),
      semester: z.string().optional(),
      department: objectId.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
});

export const assignInstructorSchema = z.object({
  body: z.object({
    instructor: objectId,
  }),
});
