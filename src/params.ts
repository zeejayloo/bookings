/**
 * ==========================
 * Edit these for the booking
 * ==========================
 */

const RESERVATION_URL = "https://resy.com/cities/new-york-ny/venues/minetta-tavern";
const DATE_STR = "2024-10-24";
const SEATS = 2;
const BEST_TIME_STR = "7:00pm";
const MIN_TIME_STR = "6:00pm";
const MAX_TIME_STR = "8:00pm";

/**
 * ==========================
 * Don't edit below this line
 * ==========================
 */

export { SEATS };
export const BASE_RESERVATION_URL = RESERVATION_URL.split("?")[0];

/**
 * Pass EMAIL and PASSWORD via the command line
 */
const email = process.env.EMAIL;
const password = process.env.PASSWORD;
if (!email || !password) {
  throw new Error(`EMAIL and PASSWORD should be passed in via the command line`);
}
export const EMAIL = email;
export const PASSWORD = password;

export const parseDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
};
export const DATE = parseDate(DATE_STR);

const parseTime = (timeStr: string) => {
  const [time, modifier] = timeStr.split(/(am|pm)/i);
  let [hour, minute] = time.split(":").map(Number);
  if (modifier.toLowerCase() === "pm" && hour < 12) {
    hour += 12;
  } else if (modifier.toLowerCase() === "am" && hour === 12) {
    hour = 0;
  }
  return { hour, minute };
};
export const BEST_TIME = parseTime(BEST_TIME_STR);
export const MIN_TIME = parseTime(MIN_TIME_STR);
export const MAX_TIME = parseTime(MAX_TIME_STR);
