import { TEST_TIMEOUT } from "../../playwright.config.js";
import {
  ALLOWED_TIME_WINDOW,
  BEST_TIME,
  BOOKING_URL,
  DATES,
  ON_FAILURE,
  PREFERRED_TIME_WINDOW,
  REQUIRES_HUMAN,
  RETRY_DELAY,
  SEATS,
  START_AT,
} from "../params.js";
import { parseBookingDates } from "./bookingDate.js";
import { parseBookingTimes } from "./bookingTime.js";

const isTruthy = (param: string | undefined) =>
  param === "1" || param?.toLowerCase() === "true" || param?.toLowerCase() === "t";

const parseNumber = (param: string | undefined) => (param ? Number(param) : undefined);

export const prepareRun = () => {
  // These have to be set via the commandline
  const isDevMode = process.env.DEV_MODE;
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;

  // These can be overridden via the commandline
  const url = process.env.BOOKING_URL ?? BOOKING_URL;
  const seats = parseNumber(process.env.SEATS) ?? SEATS;
  const requiresHuman = isTruthy(process.env.REQUIRES_HUMAN) || REQUIRES_HUMAN;
  const datesStr = process.env.DATES ?? DATES;
  const bestTimeStr = process.env.BEST_TIME ?? BEST_TIME;
  const preferredTimesStr = process.env.PREFERRED_TIME_WINDOW ?? PREFERRED_TIME_WINDOW;
  const allowedTimesStr = process.env.ALLOWED_TIME_WINDOW ?? ALLOWED_TIME_WINDOW;
  const onFailure = process.env.ON_FAILURE ?? ON_FAILURE;
  const retryDelay = parseNumber(process.env.RETRY_DELAY) ?? RETRY_DELAY;
  const startAtStr = process.env.START_AT ?? START_AT;

  // Figure out if there's a delay before starting to book
  let startMode;
  if (!startAtStr || startAtStr.toLowerCase() === "now") {
    startMode = { type: "NOW" as const };
  } else {
    const [time, modifier] = startAtStr.split(/(am|pm)/i);
    let [hour, minute, second] = time.split(":").map(Number);
    if (second === undefined) {
      second = 0;
    }
    if (modifier.toLowerCase() === "pm" && hour < 12) {
      hour += 12;
    } else if (modifier.toLowerCase() === "am" && hour === 12) {
      hour = 0;
    }
    const now = new Date();
    const startAt = new Date(now);
    startAt.setHours(hour, minute, second);
    // Ensure startAt is in the future
    if (startAt < now) {
      startAt.setDate(startAt.getDate() + 1);
      // Again in case of daylight savings!?
      startAt.setHours(hour, minute, second);
    }
    if (startAt.getTime() - now.getTime() > TEST_TIMEOUT - 60_000) {
      throw new Error("START_AT is too far in the future");
    }
    startMode = { type: "DELAY" as const, startAt };
  }

  // Parse failure mode
  let failureMode;
  if (onFailure === "retry") {
    failureMode = { type: "RETRY" as const, delay: retryDelay };
  } else {
    failureMode = { type: "STOP" as const };
  }

  // Figure out the run mode
  let runMode;
  if (isDevMode) {
    runMode = { type: "DEV" as const, requiresHuman, startMode, failureMode };
  } else {
    if (!email || !password) {
      throw new Error("EMAIL and PASSWORD required");
    }
    const login = { email, password };
    runMode = { type: "REAL" as const, login, requiresHuman, startMode, failureMode };
  }

  // Clean up the url params
  const baseUrl = url.split("?")[0];

  // Parse dates and times
  let dates = parseBookingDates(datesStr);
  const { preferredTimes, allowedTimes } = parseBookingTimes(
    bestTimeStr,
    preferredTimesStr,
    allowedTimesStr
  );

  return {
    runMode,
    baseUrl,
    seats,
    dates,
    preferredTimes,
    allowedTimes,
  };
};
