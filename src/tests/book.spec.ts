import { test } from "@playwright/test";
import { prettifyBookingDate } from "../helpers/bookingDate.js";
import { prettifyBookingTime } from "../helpers/bookingTime.js";
import { prepareRun } from "../helpers/prep.js";
import { attemptBooking, closeOffersPopup, login } from "../helpers/resy.js";
import { prettifyDelay, prettifyTime } from "../helpers/time.js";
import { BookingResult } from "../helpers/util.js";

const printSuccessfulBooking = (result: BookingResult) => {
  if (result.type === "BOOKED") {
    console.log(
      `==========================
Booked for ${prettifyBookingDate(result.date)} at ${prettifyBookingTime(result.time)}
==========================`
    );
  } else {
    console.log(
      `==========================
Tried to book ${prettifyBookingDate(result.date)} at ${prettifyBookingTime(result.time)}, but ${result.type}
==========================`
    );
  }
};

test("book", async ({ page }, testInfo) => {
  const { runMode, failureMode, baseUrl, seats, dates, preferredTimes, allowedTimes } =
    prepareRun();

  console.log(`==========================
${runMode.type === "DEV" ? `Test booking ${baseUrl}` : `Attempting to book ${baseUrl}`}
user: ${runMode.login?.email ?? "NOT SPECIFIED"}
seats: ${seats}
dates: ${dates.map((d) => prettifyBookingDate(d)).join(", ")} 
preferred times: ${preferredTimes.map((t) => prettifyBookingTime(t)).join(", ")} 
allowed times: ${allowedTimes.map((t) => prettifyBookingTime(t)).join(", ")}
on failure: ${
    failureMode.type === "RETRY"
      ? `RETRY every ${prettifyDelay(failureMode.delay)}`
      : failureMode.type
  }
==========================`);

  console.log(`=== Going to ${baseUrl}`);
  await page.goto(baseUrl);

  /**
   * Login (unless in dev mode)
   */

  if (runMode.type === "DEV") {
    console.log(`=== Skipping login, only testing`);
  } else {
    console.log(`=== Logging in as ${runMode.login.email}`);
    await login(page, runMode.login);
    console.log(`=== Login successful`);
  }

  closeOffersPopup(page).catch((err) => {
    console.log(`ERROR - error closing offers popup`, err);
  });

  /**
   * Wait to start
   */
  if (runMode.startMode.type !== "NOW") {
    while (true) {
      const now = Date.now();
      const startAt = runMode.startMode.at.getTime();
      if (startAt <= now) {
        break;
      }
      const delay = startAt - now;
      console.log(
        `=== ${prettifyTime(new Date())} Not starting until ${prettifyTime(runMode.startMode.at)}, \
waiting ${prettifyDelay(delay)}`
      );
      if (delay > 1000) {
        await new Promise((r) => setTimeout(r, delay / 2));
      } else {
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  /**
   * Attempt to book
   */

  const autoBook = !runMode.requiresHuman;
  while (true) {
    console.log(`=== ${prettifyTime(new Date())} Checking preferred times`);
    const preferredResult = await attemptBooking(page, testInfo, {
      baseUrl,
      dates,
      times: preferredTimes,
      seats,
      autoBook,
    });
    if (preferredResult) {
      printSuccessfulBooking(preferredResult);
      return;
    }

    let allowedResult: BookingResult | undefined;
    if (allowedTimes.length) {
      console.log(`=== ${prettifyTime(new Date())} Checking allowed times`);
      allowedResult = await attemptBooking(page, testInfo, {
        baseUrl,
        dates,
        times: allowedTimes,
        seats,
        autoBook,
      });
      if (allowedResult) {
        printSuccessfulBooking(allowedResult);
        return;
      }
    }

    if (failureMode.type === "RETRY") {
      // Randomize time slightly to add / subtract 20%
      const slightRandomization = 0.8 + Math.random() * 0.4;
      const retryDelay = failureMode.delay * slightRandomization;
      const now = Date.now();
      if (runMode.stopMode.type !== "NEVER") {
        if (now + retryDelay > runMode.stopMode.at.getTime()) {
          console.log(`=== ${prettifyTime(new Date())} Unable to book`);
          return;
        }
      }

      console.log(
        `=== ${prettifyTime(new Date())} Unable to book, waiting ${prettifyDelay(retryDelay)} to retry`
      );
      await new Promise((r) => setTimeout(r, retryDelay));
    } else {
      console.log(`=== ${prettifyTime(new Date())} Unable to book`);
      return;
    }
  }
});
