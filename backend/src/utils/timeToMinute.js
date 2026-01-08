const DAY_OFFSET = {
  Mon: 0,
  Tue: 1440,
  Wed: 2880,
  Thu: 4320,
  Fri: 5760,
  Sat: 7200,
};

export const toWeekMinutes = (day, time) => {
  const [h, m] = time.split(":").map(Number);
  return DAY_OFFSET[day] + h * 60 + m;
};

/* Handle cross-day */
export const getTimeRange = (day, start, end) => {
  const startMin = toWeekMinutes(day, start);
  let endMin = toWeekMinutes(day, end);

  if (endMin <= startMin) {
    endMin += 1440; // next day
  }

  return { startMin, endMin };
};
