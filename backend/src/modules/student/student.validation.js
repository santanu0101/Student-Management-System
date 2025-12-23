import { email, z } from "zod";

export const createStudentSchema = z.object({
  body: z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    dob: z.string().optional(),
    gender: z.enum(["Male", "Female", "Other"]).optional(),
    address: z.string().optional(),
    department: z.string(),
  }),
});

export const updateStudentSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    phone: z.string().optional(),
    dob: z.string().optional(),
    gender: z.enum(["Male", "Female", "Other"]).optional(),
    address: z.string().optional(),
    department: z.string().optional(),
  }),
});

export const updateStudentStatusSchema = z.object({
  body: z.object({
    status: z.enum(["active", "graduated", "suspended"]),
  }),
});
