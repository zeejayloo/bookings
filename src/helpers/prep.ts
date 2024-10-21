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
  STOP_AT,
} from "../params.js";
import { parseBookingDates } from "./bookingDate.js";
import { parseBookingTimes } from "./bookingTime.js";
import { parseFutureTimeWithSeconds } from "./time.js";

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
  const allowedTimesStr =
    process.env.ALLOWED_TIME_WINDOW ?? ALLOWED_TIME_WINDOW ?? PREFERRED_TIME_WINDOW;
  const onFailure = process.env.ON_FAILURE ?? ON_FAILURE;
  const retryDelay = parseNumber(process.env.RETRY_DELAY) ?? RETRY_DELAY;
  const startAt = process.env.START_AT ?? START_AT;
  const stopAt = process.env.STOP_AT ?? STOP_AT;

  let startMode;
  if (startAt.toUpperCase() === "NOW") {
    startMode = { type: "NOW" as const };
  } else {
    const startTime = parseFutureTimeWithSeconds(startAt);
    startMode = { type: "SCHEDULED" as const, at: startTime };
  }

  let stopMode;
  if (stopAt.toUpperCase() === "NEVER") {
    stopMode = { type: "NEVER" as const };
  } else {
    const stopTime = parseFutureTimeWithSeconds(stopAt);
    stopMode = { type: "SCHEDULED" as const, at: stopTime };
  }

  // Figure out if there's a delay before starting to book
  let failureMode;
  if (onFailure.toUpperCase() === "STOP") {
    failureMode = { type: "STOP" as const };
  } else {
    failureMode = { type: "RETRY", delay: retryDelay };
  }

  // Figure out the run mode
  let runMode;
  if (isDevMode) {
    runMode = { type: "DEV" as const, requiresHuman, startMode, stopMode };
  } else {
    if (!email || !password) {
      throw new Error("EMAIL and PASSWORD required");
    }
    const login = { email, password };
    runMode = { type: "REAL" as const, login, requiresHuman, startMode, stopMode };
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
    failureMode,
    baseUrl,
    seats,
    dates,
    preferredTimes,
    allowedTimes,
  };
};
