import { Page, TestInfo } from "playwright/test";
import { RESERVATION_URL } from "../params.js";
import { BookingDate } from "./bookingDate.js";
import { BookingTime } from "./bookingTime.js";

export type BookingResult = {
  type: "NEEDS_LOGIN" | "BOOKED";
  date: BookingDate;
  time: BookingTime;
};

export const BASE_RESERVATION_URL = RESERVATION_URL.split("?")[0];

export const sanitizeForFilename = (description: string) => {
  // Trim, remove invalid characters, and normalize
  let filename = description
    .trim()
    .replace(/["%'*/:<>?\\|]/g, "")
    .replace(/\s+/g, "-");

  // Limit length
  const maxFilenameLength = 64;
  if (filename.length > maxFilenameLength) {
    filename = filename.substring(0, maxFilenameLength);
  }
  return filename;
};

export const screenshotPage = async (page: Page, testInfo: TestInfo, description: string) => {
  const filename = sanitizeForFilename(description);
  const screenshotBuffer = await page.screenshot({ type: "jpeg" });
  await testInfo.attach(filename, {
    body: screenshotBuffer,
    contentType: "image/jpeg",
  });
};
