import { STUDENT_STATUS } from "../constants/status.js";

export const STATUS_USER_ACCESS = Object.freeze({
  [STUDENT_STATUS.ACTIVE]: true,
  [STUDENT_STATUS.GRADUATED]: false,
  [STUDENT_STATUS.SUSPENDED]: false,
});

export const canUserAccessSystem = (studentStatus) => {
  return STATUS_USER_ACCESS[studentStatus] ?? false;
};
