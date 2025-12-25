import { INSTRUCTOR_STATUS } from "../constants/status.js";

export const STATUS_USER_ACCESS = Object.freeze({
  [INSTRUCTOR_STATUS.ACTIVE]: true,
  [INSTRUCTOR_STATUS.ONLEAVE]: false,
  [INSTRUCTOR_STATUS.RETIRED]: false,
});

export const canUserAccessSystem = (instructorStatus) => {
  return STATUS_USER_ACCESS[instructorStatus] ?? false;
}