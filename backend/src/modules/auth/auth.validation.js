import { z } from "zod";


export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["admin", "student", "instructor"]),
    studentId: z.string().optional(),
    instructorId: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});


export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string(),
  })
})


export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(6),
    newPassword: z.string().min(6)
  })
})
