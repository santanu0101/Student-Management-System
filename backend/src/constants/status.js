export const STUDENT_STATUS = Object.freeze({
  ACTIVE: "active",
  GRADUATED: "graduated",
  SUSPENDED: "suspended",
});

export const STUDENT_STATUS_TRANSITIONS = Object.freeze({
  active: ["suspended", "graduated"],
  suspended: ["active"],
  graduated: [], // terminal state
});

export const INSTRUCTOR_STATUS = Object.freeze({
  ACTIVE: "active",
  ONLEAVE: "onleave",
  RETIRED: "retired",
});

export const INSTRUCTOR_STATUS_TRANSITIONS = Object.freeze({
  active: ["onleave", "retired"],
  onleave: ["active"],
  retired: [], // terminal state
});

export const ENROLLMENT_STATUS = Object.freeze({
  ENROLLED: "enrolled",
  DROPPED: "dropped",
  COMPLETED: "completed",
});

export const PAYMENT_STATUS = Object.freeze({
  PAID: "paid",
  PENDING: "pending",
  FAILED: "failed",
});
