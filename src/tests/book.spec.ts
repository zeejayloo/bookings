import { test } from "@playwright/test";
import { getBookingDates, prettifyDate } from "../helpers/bookingDate.js";
import {
  getAllowedBookingTimes,
  getPreferredBookingTimes,
  prettifyTime,
} from "../helpers/bookingTime.js";
import { attemptBooking, login } from "../helpers/resy.js";
import { BASE_RESERVATION_URL, BookingResult } from "../helpers/util.js";
import { ALLOWED_TIME_WINDOW, BEST_TIME, DATES, PREFERRED_TIME_WINDOW, SEATS } from "../params";

const getRetryDelay = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const withinSeconds = 2;
  const withinMinutes = 1;

  // Check if within X seconds of the hour
  if (
    (minutes === 59 && seconds >= 60 - withinSeconds) ||
    (minutes === 0 && seconds <= withinSeconds)
  ) {
    return {
      delay: 250,
      description: `<1s`,
    };
  }
  // Check if within X minutes of the hour
  else if (minutes >= 60 - withinMinutes || minutes < withinMinutes) {
    return {
      delay: 1000 + (Math.random() - 0.5) * 400,
      description: `a second`,
    };
  }
  // Otherwise
  return {
    delay: 5_000 + (Math.random() - 0.5) * 2_000,
    description: `5 seconds`,
  };
};

const printSuccessfulBooking = (result: BookingResult) => {
  if (result.type === "BOOKED") {
    console.log(
      `==========================
Booked for ${prettifyDate(result.date)} at ${prettifyTime(result.time)}
==========================`
    );
  } else {
    console.log(
      `==========================
Tried to book ${prettifyDate(result.date)} at ${prettifyTime(result.time)}, but ${result.type}
==========================`
    );
  }
};

test("book", async ({ page }) => {
  let dates = getBookingDates();
  const preferredTimes = getPreferredBookingTimes();
  const allowedTimes = getAllowedBookingTimes();

  console.log(`==========================
Attempting to book ${BASE_RESERVATION_URL}
user: ${process.env.EMAIL ?? "NOT SPECIFIED"}
seats: ${SEATS}
dates: ${DATES} 
best time: ${BEST_TIME}
preferred times: ${PREFERRED_TIME_WINDOW} 
allowed times: ${ALLOWED_TIME_WINDOW}
==========================`);

  console.log(`=== Going to ${BASE_RESERVATION_URL}`);
  await page.goto(BASE_RESERVATION_URL);

  /**
   * Login (unless in dev mode)
   */

  if (process.env.DEV_MODE) {
    console.log(`=== Skipping login`);
  } else {
    if (!process.env.EMAIL || !process.env.PASSWORD) {
      console.log(`==========================
ERROR: email and password required
==========================`);
      return;
    }
    console.log(`=== Logging in as ${process.env.EMAIL}`);
    await login(page, { email: process.env.EMAIL, password: process.env.PASSWORD });
    console.log(`=== Login successful`);
  }

  /**
   * Attempt to book
   */

  while (true) {
    console.log("=== Checking preferred times");
    const preferredResult = await attemptBooking(page, dates, preferredTimes);
    if (preferredResult) {
      printSuccessfulBooking(preferredResult);
      return;
    }

    let allowedResult: BookingResult | undefined;
    if (allowedTimes.length) {
      console.log("=== Checking allowed times");
      allowedResult = await attemptBooking(page, dates, allowedTimes);
      if (allowedResult) {
        printSuccessfulBooking(allowedResult);
        return;
      }
    } else {
      console.log(`=== Not checking allowed time window - no additional times`);
    }

    const { delay, description } = getRetryDelay();
    console.log(`=== Unable to book, waiting ${description} to retry`);
    await new Promise((r) => setTimeout(r, delay));
  }
});
