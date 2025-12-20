import { z } from "zod";

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Department name is required"),
    building: z.string().optional(),
  }),
});

export const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    building: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const assignHodSchema = z.object({
  body: z.object({
    instructorId: z.string().min(1, "Instructor ID required"),
  }),
});
