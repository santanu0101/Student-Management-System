import { z } from "zod";
import { ATTENDANCE_STATUS } from "../../constants/status.js";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const attendanceStatusEnum = z.enum(Object.values(ATTENDANCE_STATUS));

export const markAttendanceSchema = z.object({
  body: z.object({
    studentId: objectId,
    courseId: objectId,
    date: z
      .string()
      .refine((val) => !isNaN(new Date(val).getTime()), "Invalid date format"),
    status: attendanceStatusEnum,
  }),
});

export const getAttendanceSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const getAttendanceByStudentSchema = z.object({
  params: z.object({
    studentId: objectId,
  }),
});

export const getAttendanceByCourseSchema = z.object({
  params: z.object({
    courseId: objectId,
  }),
});

export const updateAttendanceSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    status: attendanceStatusEnum.optional(),
    date: z
      .string()
      .optional()
      .refine(
        (val) => !val || !isNaN(new Date(val).getTime()),
        "Invalid date format"
      ),
  }),
});

export const deleteAttendanceSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const getAttendancePercentageSchema = z.object({
  params: z.object({
    studentId: objectId,
  }),
  query: z.object({
    courseId: objectId.optional(),
  }),
});
