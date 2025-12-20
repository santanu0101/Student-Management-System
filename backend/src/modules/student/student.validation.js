import {email, z} from "zod"

export const createStudentSchema = z.object({
    body: z.object({
        firstName: z.string().min(2),
        lastName: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional(),
        dob: z.string().optional(),
        gender: z.enum(["Male", "Female", "Other"]).optional(),
        address: z.string().optional(),
        department:z.string()
    })
})