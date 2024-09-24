import { ALLOWED_TIME_WINDOW, BEST_TIME, PREFERRED_TIME_WINDOW } from "../params.js";

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

export const getPreferredBookingTimes = (): BookingTime[] => {
  const bestTime = parseSingleTime(BEST_TIME);
  const [minTimeStr, maxTimeStr] = PREFERRED_TIME_WINDOW.split("-").map((part) => part.trim());
  const minTime = parseSingleTime(minTimeStr);
  const maxTime = parseSingleTime(maxTimeStr);
  const preferredTimes = new Array<BookingTime>(bestTime);
  let increment = 15;
  while (true) {
    const earlierTime = addMinutes(bestTime, -1 * increment);
    const laterTime = addMinutes(bestTime, increment);
    const tooEarly = compareTimes(earlierTime, minTime) < 0;
    const tooLate = compareTimes(laterTime, maxTime) > 0;
    if (tooEarly && tooLate) {
      return preferredTimes;
    }
    if (!tooEarly) {
      preferredTimes.push(earlierTime);
    }
    if (!tooLate) {
      preferredTimes.push(laterTime);
    }
    increment += 15;
  }
};

export const getAllowedBookingTimes = (): BookingTime[] => {
  const [minPrefStr, maxPrefStr] = PREFERRED_TIME_WINDOW.split("-").map((part) => part.trim());
  const minPref = parseSingleTime(minPrefStr);
  const maxPref = parseSingleTime(maxPrefStr);
  const [minAllowedStr, maxAllowedStr] = ALLOWED_TIME_WINDOW.split("-").map((part) => part.trim());
  const minAllowed = parseSingleTime(minAllowedStr);
  const maxAllowed = parseSingleTime(maxAllowedStr);
  const allowedTimes = new Array<BookingTime>();
  let increment = 15;
  while (true) {
    const earlierTime = addMinutes(minPref, -1 * increment);
    const laterTime = addMinutes(maxPref, increment);
    const tooEarly = compareTimes(earlierTime, minAllowed) < 0;
    const tooLate = compareTimes(laterTime, maxAllowed) > 0;
    if (tooEarly && tooLate) {
      return allowedTimes;
    }
    if (!tooEarly) {
      allowedTimes.push(earlierTime);
    }
    if (!tooLate) {
      allowedTimes.push(laterTime);
    }
    increment += 15;
  }
};

export const prettifyTime = ({ hour, minute }: BookingTime) => {
  const period = hour >= 12 ? "pm" : "am";
  let adjustedHour = hour % 12 || 12; // Convert 0 or 12 to 12
  const formattedMinute = minute.toString().padStart(2, "0"); // Ensure two digits for minutes
  return `${adjustedHour}:${formattedMinute}${period}`;
};

export const stringifyTime = ({ hour, minute }: BookingTime) =>
  `${hour}:${minute.toString().padStart(2, "0")}`;
