import { expect, Locator, Page } from "@playwright/test";
import { prettifyDate } from "./bookingDate.js";
import { BookingTime, prettifyTime, stringifyTime } from "./bookingTime.js";
import { BookingRequest, BookingRequestForDate, BookingResult } from "./util.js";

export const login = async (
  page: Page,
  { email, password }: { email: string; password: string }
) => {
  // Click button to login
  const loginButton = page.locator("[data-test-id='menu_container-button-log_in']");
  await loginButton.click();

  // Use email and password to login
  await page.getByRole("button", { name: "Use Email and Password instead" }).click();
  await page.getByPlaceholder("Email Address").click();
  await page.getByPlaceholder("Email Address").fill(email);
  await page.getByPlaceholder("Password").fill(password);
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

const findBestTime = async (reservationButtons: Locator, times: BookingTime[]) => {
  const buttonsAll = await reservationButtons.all();
  const buttonsByTime = new Map<string, Locator>();
  const buttonTimes = new Array<BookingTime>();
  for (const button of buttonsAll) {
    const id = await button.getAttribute("id");
    if (!id) {
      console.log("- reservation button missing id, skipping");
      continue;
    }
    const timeRegex = /\/(\d{2}):(\d{2}):\d{2}\//;
    // Execute the regex to find the time in the string
    const match = timeRegex.exec(id);
    if (!match) {
      console.log(`- reservation button id "${id}" can' be parsed, skipping`);
      continue;
    }
    const time = {
      hour: Number(match[1]),
      minute: Number(match[2]),
    };
    buttonsByTime.set(stringifyTime(time), button);
    buttonTimes.push(time);
  }
  console.log(`- reservation buttons found: ${buttonTimes.map((t) => prettifyTime(t)).join(", ")}`);

  for (const time of times) {
    const prettyTime = prettifyTime(time);
    const timeButton = buttonsByTime.get(stringifyTime(time));
    if (timeButton) {
      console.log(`- found reservation for ${prettyTime}`);
      return { timeButton, time };
    }
  }
};

const completeBooking = async (
  page: Page,
  { timeButton, time }: { timeButton: Locator; time: BookingTime }
) => {
  console.log(`- clicking on ${prettifyTime(time)}`);
  await timeButton.click();

  // The booking modal is in an iFrame
  const bookingFrame = page.frameLocator('iframe[title="Resy - Book Now"]');
  await expect(bookingFrame.locator(".WidgetPage")).toBeVisible();

  const reserveNow = bookingFrame.locator(".Button--primary");
  console.log(`- clicking Reserve Now`);
  await reserveNow.click();

  const confirmButton = bookingFrame.locator(".Button--double-confirm");
  for (let i = 0; i < 20; i++) {
    // Acknowledge cancellation fees etc
    if (await confirmButton.isVisible()) {
      console.log(`- clicking Confirm`);
      await confirmButton.click();
      break;
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  const needsLogin = bookingFrame.locator(".AuthContainer");
  for (let i = 0; i < 20; i++) {
    if (await needsLogin.isVisible()) {
      return "NEEDS_LOGIN" as const;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return "BOOKED" as const;
};

export const attemptBooking = async (
  page: Page,
  { baseUrl, dates, times, seats, autoBook }: BookingRequest
): Promise<BookingResult | undefined> => {
  for (const date of dates) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await attemptBookingForDate(page, {
          baseUrl,
          date,
          times,
          seats,
          autoBook,
        });
        if (result) return result;
        break;
      } catch {
        console.log(`ERROR - attempt #${attempt} to book ${prettifyDate(date)} failed`);
      }
    }
  }
};

export const attemptBookingForDate = async (
  page: Page,
  { baseUrl, date, times, seats, autoBook }: BookingRequestForDate
) => {
  const prettyDate = prettifyDate(date);
  const dateParam = `${date.year}-${date.month.toString().padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
  const fullUrl = `${baseUrl}?date=${dateParam}&seats=${seats}`;

  console.log(`Checking availability for ${prettyDate}...`);
  await page.goto(fullUrl);
  if (page.url() !== fullUrl) {
    console.log(
      `ERROR - Got redirected from ${fullUrl} to ${page.url()}, please make sure your date and seats are valid`
    );
    return;
  }

  await expect(page.locator(".VenuePage")).toBeVisible({ timeout: 1_000 });

  const notOnlineLoc = page.getByText("At the moment, there's no online availability");
  const noTablesLoc = page.getByText("Sorry, we don't currently have any tables");
  const reservationsLoc = page.locator(".ReservationButton");

  // One of these things should be visible
  await expect(notOnlineLoc.or(noTablesLoc).or(reservationsLoc.first())).toBeVisible({
    timeout: 1_000,
  });

  if (await reservationsLoc.first().isVisible()) {
    console.log(`Checking times for ${prettyDate}......`);
    const timeAndButton = await findBestTime(reservationsLoc, times);
    if (timeAndButton) {
      if (autoBook) {
        console.log(`Trying to book at ${prettifyTime(timeAndButton.time)}...`);
        const resultType = await completeBooking(page, timeAndButton);
        return { type: resultType, date, time: timeAndButton.time };
      } else {
        console.log(`Requires human to finish booking...`);
        await timeAndButton.timeButton.click();
        await new Promise((r) => setTimeout(r, 10 * 60_000));
      }
    } else {
      console.log(`No tables available in specified time window`);
    }
  } else if (await noTablesLoc.isVisible()) {
    console.log(`No tables available at all`);
  } else if (await notOnlineLoc.isVisible()) {
    console.log(`Date doesn't have tables posted yet`);
  } else {
    console.log(`ERROR - Unhandled result for ${prettyDate}`);
  }
};
