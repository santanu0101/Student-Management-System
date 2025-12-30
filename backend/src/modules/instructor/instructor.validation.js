import { z } from "zod";
import { INSTRUCTOR_STATUS } from "../../constants/status.js";
import { GENDER } from "../../constants/enums.js";

/**
 * MongoDB ObjectId validator
 */
const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const createInstructorSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    email: z.string().email(),
    phone: z.string().min(8).max(15).optional(),
    dob: z.coerce.date().optional(), // formts like 'YYYY-MM-DD'
    gender: z.enum([GENDER.MALE, GENDER.FEMALE, GENDER.OTHER]).optional(),
    address: z.string().max(255).optional(),
    hireDate: z.coerce.date().optional(),
    department: objectId,
  }),
});

export const updateInstructorSchema = z.object({
  body: z
    .object({
      firstName: z.string().min(2).max(50).optional(),
      lastName: z.string().min(2).max(50).optional(),
      email: z.string().email().optional(),
      phone: z.string().min(8).max(15).optional(),
      dob: z.coerce.date().optional(),
      gender: z.enum([GENDER.MALE, GENDER.FEMALE, GENDER.OTHER]).optional(),
      address: z.string().max(255).optional(),
      department: objectId.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required to update",
    }),
});

export const updateInstructorStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      INSTRUCTOR_STATUS.ACTIVE,
      INSTRUCTOR_STATUS.ONLEAVE,
      INSTRUCTOR_STATUS.RETIRED,
    ]),
  }),
});
