import { Page, TestInfo } from "playwright/test";

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

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const prettyDate = ({ month, day, year }: { month: number; day: number; year: number }) => {
  const monthName = MONTH_NAMES[month - 1];
  return `${monthName} ${day}, ${year}`;
};

export const prettyTime = ({ hour, minute }: { hour: number; minute: number }) => {
  const period = hour >= 12 ? "pm" : "am";
  let adjustedHour = hour % 12 || 12; // Convert 0 or 12 to 12
  const formattedMinute = minute.toString().padStart(2, "0"); // Ensure two digits for minutes
  return `${adjustedHour}:${formattedMinute}${period}`;
};

export const compareTimes = (
  time1: { hour: number; minute: number },
  time2: { hour: number; minute: number }
) => {
  if (time1.hour !== time2.hour) {
    return time1.hour - time2.hour;
  }
  return time1.minute - time2.minute;
};

export const addMinutes = (time: { hour: number; minute: number }, minutes: number) => {
  const totalMinutes = time.hour * 60 + time.minute + minutes;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return { hour, minute };
};
