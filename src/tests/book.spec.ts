import { expect, Locator, Page, test } from "@playwright/test";
import { addMinutes, compareTimes, prettyDate, prettyTime } from "../helpers.js";
import {
  BASE_RESERVATION_URL,
  BEST_TIME,
  DATE,
  EMAIL,
  MAX_TIME,
  MIN_TIME,
  PASSWORD,
  SEATS,
} from "../params";

const login = async (page: Page) => {
  // Click button to login
  const loginButton = page.locator("[data-test-id='menu_container-button-log_in']");
  await loginButton.click();

  // Use email and password to login
  await page.getByRole("button", { name: "Use Email and Password instead" }).click();
  await page.getByPlaceholder("Email Address").click();
  await page.getByPlaceholder("Email Address").fill(EMAIL);
  await page.getByPlaceholder("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Continue" }).click();

  // Dismiss any offers
  for (let i = 0; i < 10; i++) {
    const secondaryButton = page.locator("[data-test-id='announcement-button-secondary']");
    if (await secondaryButton.isVisible()) {
      await secondaryButton.click();
      break;
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  // Check logged in
  await expect(loginButton).not.toBeVisible();
};

const findBestTime = async (reservationButtons: Locator) => {
  const buttonsAll = await reservationButtons.all();
  const buttonsByTime = new Map<string, Locator>();
  for (const button of buttonsAll) {
    const id = await button.getAttribute("id");
    if (!id) {
      console.log("- reservation button missing id, skipping");
      continue;
    }
    const timeRegex = /\/(\d{2}:\d{2}):\d{2}\//;
    // Execute the regex to find the time in the string
    const match = timeRegex.exec(id);
    if (!match) {
      console.log(`- reservation button id "${id}" can' be parsed, skipping`);
      continue;
    }
    const timeStr = match[1];
    console.log(`- reservation button for ${timeStr}`);
    buttonsByTime.set(timeStr, button);
  }

  let increment = 0;
  while (true) {
    const earlierTime = addMinutes(BEST_TIME, -1 * increment);
    const laterTime = addMinutes(BEST_TIME, increment);
    const tooEarly = compareTimes(earlierTime, MIN_TIME) < 0;
    const tooLate = compareTimes(laterTime, MAX_TIME) > 0;
    if (tooEarly && tooLate) {
      console.log(`- no more times to check`);
      return;
    }
    if (!tooEarly && compareTimes(laterTime, earlierTime) !== 0) {
      const timeStr = `${earlierTime.hour}:${earlierTime.minute.toString().padStart(2, "0")}`;
      console.log(`- checking ${prettyTime(earlierTime)} (${timeStr})`);
      const timeButton = buttonsByTime.get(timeStr);
      if (timeButton) {
        console.log(`- found reservation for ${prettyTime(earlierTime)}`);
        return { timeButton, time: earlierTime };
      }
    }
    if (!tooLate) {
      const timeStr = `${laterTime.hour}:${laterTime.minute.toString().padStart(2, "0")}`;
      console.log(`- checking ${prettyTime(laterTime)} (${timeStr})`);
      const timeButton = buttonsByTime.get(timeStr);
      if (timeButton) {
        console.log(`- found reservation for ${prettyTime(laterTime)} `);
        return { timeButton, time: laterTime };
      }
    }
    increment += 15;
  }
};

const completeBooking = async (
  page: Page,
  { timeButton, time }: { timeButton: Locator; time: { hour: number; minute: number } }
) => {
  console.log(`- clicking on ${prettyTime(time)}`);
  await timeButton.click();

  // The booking modal is in an iFrame
  const bookingFrame = page.frameLocator('iframe[title="Resy - Book Now"]');
  await expect(bookingFrame.locator(".WidgetPage")).toBeVisible();

  const reserveNow = bookingFrame.locator(".Button--primary");
  console.log(`- clicking Reserve Now`);
  await reserveNow.click();

  for (let i = 0; i < 20; i++) {
    // Acknowledge cancellation fees etc
    const confirmButton = bookingFrame.locator(".Button--double-confirm");
    if (await confirmButton.isVisible()) {
      console.log(`- clicking Confirm`);
      await confirmButton.click();
      break;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
};

test("book", async ({ page }) => {
  console.log(`==========================
Attempting to book ${BASE_RESERVATION_URL}
user: ${EMAIL}
seats: ${SEATS}
date: ${prettyDate(DATE)}
best time: ${prettyTime(BEST_TIME)}
allowed times: ${prettyTime(MIN_TIME)} to ${prettyTime(MAX_TIME)}
==========================`);

  const dateParam = `${DATE.year}-${DATE.month.toString().padStart(2, "0")}-${DATE.day.toString().padStart(2, "0")}`;
  const fullURL = `${BASE_RESERVATION_URL}?date=${dateParam}&seats=${SEATS}`;

  console.log(`Going to ${fullURL}`);
  await page.goto(fullURL);
  if (page.url() !== fullURL) {
    throw new Error(
      `Got redirected to ${page.url()}, please make sure your date and seats are valid`
    );
  }

  console.log(`Logging in as ${EMAIL}`);
  await login(page);
  console.log(`Login successful`);

  while (true) {
    await expect(page.locator(".VenuePage")).toBeVisible();

    const notOnlineLoc = page.getByText("At the moment, there's no online availability");
    const noTablesLoc = page.getByText("Sorry, we don't currently have any tables");
    const reservationsLoc = page.locator(".ReservationButton");

    // One of these things should be visible
    console.log("Checking availability...");
    await expect(notOnlineLoc.or(noTablesLoc).or(reservationsLoc.first())).toBeVisible();

    if (await reservationsLoc.first().isVisible()) {
      console.log(`Checking times...`);
      const result = await findBestTime(reservationsLoc);
      if (result) {
        console.log(`Trying to book at ${prettyTime(result.time)}...`);
        await completeBooking(page, result);
        console.log(`=== Completed booking, please confirm for yourself ===`);
      } else {
        console.log(`=== There are no tables available in the specified window, sorry ===`);
        break;
      }
      break;
    } else if (await noTablesLoc.isVisible()) {
      console.log(`=== There are no tables available, sorry ===`);
      break;
    } else if (await notOnlineLoc.isVisible()) {
      console.log("=== Online booking not available yet, waiting to retry ===");
      await new Promise((r) => setTimeout(r, 500));
      page.reload();
    } else {
      throw new Error(`Unhandled use case`);
    }
  }
});
