import { expect, Locator, Page, TestInfo } from "@playwright/test";
import { prettifyBookingDate } from "./bookingDate.js";
import { BookingTime, prettifyBookingTime, stringifyBookingTime } from "./bookingTime.js";
import { BookingRequest, BookingRequestForDate, BookingResult, screenshotPage } from "./util.js";

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

  // Check logged in
  await expect(loginButton).not.toBeVisible();
};

export const closeOffersPopup = async (page: Page) => {
  while (true) {
    const secondaryButton = page.locator("[data-test-id='announcement-button-secondary']");
    if (await secondaryButton.isVisible()) {
      await secondaryButton.click();
      break;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
};

const findBestTime = async (reservationButtons: Locator, times: BookingTime[]) => {
  const buttonsAll = await reservationButtons.all();
  const buttonsByTime = new Map<string, Locator>();
  const buttonTimes = new Array<BookingTime>();
  for (const button of buttonsAll) {
    const id = await button.getAttribute("id");
    if (!id) {
      console.log("-- reservation button missing id, skipping");
      continue;
    }
    const timeRegex = /\/(\d{2}):(\d{2}):\d{2}\//;
    // Execute the regex to find the time in the string
    const match = timeRegex.exec(id);
    if (!match) {
      console.log(`-- reservation button id "${id}" can' be parsed, skipping`);
      continue;
    }
    const time = {
      hour: Number(match[1]),
      minute: Number(match[2]),
    };
    buttonsByTime.set(stringifyBookingTime(time), button);
    buttonTimes.push(time);
  }

  for (const time of times) {
    const timeButton = buttonsByTime.get(stringifyBookingTime(time));
    if (timeButton) {
      console.log(`-- found reservation for ${prettifyBookingTime(time)}`);
      return { result: "SUCCESS" as const, timeButton, time };
    }
  }

  return { result: "FAILURE" as const, foundTimes: buttonTimes };
};

const completeBooking = async (
  page: Page,
  { timeButton, time }: { timeButton: Locator; time: BookingTime }
) => {
  console.log(`-- clicking on ${prettifyBookingTime(time)}`);
  await timeButton.click();

  // The booking modal is in an iFrame
  const bookingFrame = page.frameLocator('iframe[title="Resy - Book Now"]');
  await expect(bookingFrame.locator(".WidgetPage")).toBeVisible();

  const reserveNow = bookingFrame.locator(".Button--primary");
  console.log(`-- clicking Reserve Now`);
  await reserveNow.click();

  const confirmButton = bookingFrame.locator(".Button--double-confirm");
  for (let i = 0; i < 20; i++) {
    // Acknowledge cancellation fees etc
    if (await confirmButton.isVisible()) {
      console.log(`-- clicking Confirm`);
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
  testInfo: TestInfo,
  { baseUrl, dates, times, seats, autoBook }: BookingRequest
): Promise<BookingResult | undefined> => {
  for (const date of dates) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await attemptBookingForDate(page, {
          baseUrl,
          date,
          times,
          seats,
          autoBook,
        });
        if (result) return result;
      } catch (err) {
        const now = new Date();
        await screenshotPage(page, testInfo, `failure at ${now}`);
        let errorMsg: string | undefined;
        if (typeof err === "object" && err !== null && "message" in err) {
          const message = (err as Record<string, unknown>).message;
          if (
            typeof message === "string" &&
            message.includes("Page showing availability slow to load")
          ) {
            errorMsg = "venue page was slow to load";
          }
        }
        console.log(
          `ERROR - attempt at ${now} to book ${prettifyBookingDate(date)} failed:`,
          errorMsg ?? err
        );
      }
    }
  }
};

export const attemptBookingForDate = async (
  page: Page,
  { baseUrl, date, times, seats, autoBook }: BookingRequestForDate
) => {
  const prettyDate = prettifyBookingDate(date);
  const dateParam = `${date.year}-${date.month.toString().padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
  const fullUrl = `${baseUrl}?date=${dateParam}&seats=${seats}`;

  console.log(`- Checking availability for ${prettyDate}...`);
  await page.goto(fullUrl);
  if (page.url() !== fullUrl) {
    console.log(
      `ERROR - Got redirected from ${fullUrl} to ${page.url()}, please make sure your date and seats are valid`
    );
    return;
  }

  await expect(page.locator(".VenuePage"), "Page showing availability slow to load").toBeVisible({
    timeout: 2_000,
  });

  const notOnlineLoc = page.getByText("At the moment, there's no online availability");
  const noTablesLoc = page.getByText("Sorry, we don't currently have any tables");
  const reservationsLoc = page.locator(".ReservationButton");

  // One of these things should be visible
  await expect(notOnlineLoc.or(noTablesLoc).or(reservationsLoc.first())).toBeVisible({
    timeout: 1_000,
  });

  if (await reservationsLoc.first().isVisible()) {
    console.log(`- Checking times for ${prettyDate}......`);
    const result = await findBestTime(reservationsLoc, times);
    if (result.result === "SUCCESS") {
      if (autoBook) {
        console.log(`- Trying to book at ${prettifyBookingTime(result.time)}...`);
        const resultType = await completeBooking(page, result);
        return { type: resultType, date, time: result.time };
      } else {
        console.log(`- Requires human to finish booking...`);
        await result.timeButton.click();
        // Wait to keep the browser open while human finishes the bookingg
        await new Promise((r) => setTimeout(r, 60 * 60_000));
      }
    } else {
      console.log(
        `- No tables in specified time window, only found: ${result.foundTimes.map((t) => prettifyBookingTime(t))}`
      );
    }
  } else if (await noTablesLoc.isVisible()) {
    console.log(`- No tables at all`);
  } else if (await notOnlineLoc.isVisible()) {
    console.log(`- Date doesn't have tables posted yet`);
  } else {
    console.log(`ERROR - Unhandled result for ${prettyDate}`);
  }
};
