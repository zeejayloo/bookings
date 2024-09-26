import { test } from "@playwright/test";
import { prettifyDate } from "../helpers/bookingDate.js";
import { prettifyTime } from "../helpers/bookingTime.js";
import { prettifyDelay, prettifyDelayUntil } from "../helpers/delay.js";
import { prepareRun } from "../helpers/prep.js";
import { attemptBooking, login } from "../helpers/resy.js";
import { BookingResult } from "../helpers/util.js";

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
  const { runMode, baseUrl, seats, dates, preferredTimes, allowedTimes } = prepareRun();
  const { startMode, failureMode } = runMode;

  console.log(`==========================
${runMode.type === "DEV" ? `Test booking ${baseUrl}` : `Attempting to book ${baseUrl}`}
user: ${runMode.login?.email ?? "NOT SPECIFIED"}
seats: ${seats}
dates: ${dates.map((d) => prettifyDate(d)).join(", ")} 
preferred times: ${preferredTimes.map((t) => prettifyTime(t)).join(", ")} 
allowed times: ${allowedTimes.map((t) => prettifyTime(t)).join(", ")}
start booking: ${startMode.type === "DELAY" ? prettifyDelayUntil(startMode.startAt) : startMode.type}
on failure: ${failureMode.type === "RETRY" ? `Retry every ${prettifyDelay(failureMode.delay)}` : failureMode.type}
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

  if (startMode.type === "DELAY") {
    const startAtTime = startMode.startAt.getTime();
    const prettyStartAt = prettifyDelayUntil(startMode.startAt);

    let now = Date.now();
    while (now < startAtTime) {
      console.log(`=== Waiting until ${prettyStartAt} to start booking`);
      await new Promise((r) => setTimeout(r, Math.min(10_000, startAtTime - now)));
      now = Date.now();
    }
  }

  /**
   * Attempt to book
   */

  const autoBook = !runMode.requiresHuman;
  while (true) {
    console.log("=== Checking preferred times");
    const preferredResult = await attemptBooking(page, {
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
      console.log("=== Checking allowed times");
      allowedResult = await attemptBooking(page, {
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
      const retryDelay = slightRandomization * failureMode.delay;
      console.log(`=== Unable to book, waiting ${prettifyDelay(retryDelay)} to retry`);
      await new Promise((r) => setTimeout(r, retryDelay));
    } else {
      console.log(`=== Unable to book`);
      return;
    }
  }
});
