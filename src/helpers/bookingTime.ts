export type BookingTime = {
  hour: number;
  minute: number;
};

const addMinutes = (time: BookingTime, minutes: number) => {
  const totalMinutes = time.hour * 60 + time.minute + minutes;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return { hour, minute };
};

const compareTimes = (time1: BookingTime, time2: BookingTime) => {
  if (time1.hour !== time2.hour) {
    return time1.hour - time2.hour;
  }
  return time1.minute - time2.minute;
};

const parseSingleTime = (timeStr: string): BookingTime => {
  const [time, modifier] = timeStr.split(/(am|pm)/i);
  let [hour, minute] = time.split(":").map(Number);
  if (modifier.toLowerCase() === "pm" && hour < 12) {
    hour += 12;
  } else if (modifier.toLowerCase() === "am" && hour === 12) {
    hour = 0;
  }
  return { hour, minute };
};

export const parseBookingTimes = (
  bestTimeParam: string,
  preferredWindowParam: string,
  allowedWindowParam: string
): { preferredTimes: BookingTime[]; allowedTimes: BookingTime[] } => {
  const best = parseSingleTime(bestTimeParam);
  const [minPrefStr, maxPrefStr] = preferredWindowParam.split("-").map((part) => part.trim());
  const minPref = parseSingleTime(minPrefStr);
  const maxPref = parseSingleTime(maxPrefStr);
  const [minAllowStr, maxAllowStr] = allowedWindowParam.split("-").map((part) => part.trim());
  const minAllow = parseSingleTime(minAllowStr);
  const maxAllow = parseSingleTime(maxAllowStr);
  const preferredTimes = new Array<BookingTime>(best);
  const allowedTimes = new Array<BookingTime>();
  let increment = 15;
  while (true) {
    const earlierTime = addMinutes(best, -1 * increment);
    const laterTime = addMinutes(best, increment);
    const prefTooEarly = compareTimes(earlierTime, minPref) < 0;
    const prefTooLate = compareTimes(laterTime, maxPref) > 0;
    const allowTooEarly = compareTimes(earlierTime, minAllow) < 0;
    const allowTooLate = compareTimes(laterTime, maxAllow) > 0;
    if (allowTooEarly && allowTooLate && prefTooEarly && prefTooLate) {
      return { preferredTimes, allowedTimes };
    }
    if (!prefTooEarly) {
      preferredTimes.push(earlierTime);
    } else if (!allowTooEarly) {
      allowedTimes.push(earlierTime);
    }
    if (!prefTooLate) {
      preferredTimes.push(laterTime);
    } else if (!allowTooLate) {
      allowedTimes.push(laterTime);
    }
    increment += 15;
  }
};

export const prettifyBookingTime = ({ hour, minute }: BookingTime) => {
  const period = hour >= 12 ? "pm" : "am";
  let adjustedHour = hour % 12 || 12; // Convert 0 or 12 to 12
  const formattedMinute = minute.toString().padStart(2, "0"); // Ensure two digits for minutes
  return `${adjustedHour}:${formattedMinute}${period}`;
};

export const stringifyBookingTime = ({ hour, minute }: BookingTime) =>
  `${hour}:${minute.toString().padStart(2, "0")}`;
