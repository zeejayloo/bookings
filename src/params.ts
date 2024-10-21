/**
 * ==========================
 * Edit these directly for your booking or use environment variables to override
 *
 * If you know reservations for a new day open at a certain time:
 * - specify that single day
 * - make preferred and allowed times the same.
 * - specify start and stop at
 * ==========================
 */

/** The reservation url. Search params in the url will be ignored. */
export const BOOKING_URL = "https://resy.com/cities/new-york-ny/venues/minetta-tavern";
/** Number of seats */
export const SEATS = 2;
/** If there's a robot check, the human has to finish the booking by hand. */
export const REQUIRES_HUMAN = false;

/**
 * Date or dates you're willing to book. Will accept ranges "10/23 - 10/25",
 * lists "10/23, 10/25", or combos of both. A booking will be made for only
 * one of the dates. Write the dates in the order you'd prefer.
 */
export const DATES = "10/25, 10/27, 10/28, 11/4 - 11/18";

/** Your ideal time for the reservation */
export const BEST_TIME = "7:00pm";
/** Your preferred times for the reservation */
export const PREFERRED_TIME_WINDOW = "6:30pm - 8:30pm";
/**
 * Your allowed times for the reservation. If you specified multiple dates,
 * will check all the dates for the preferred times before checking the
 * allowed times. If it's same or narrower than the preferred window, no
 * additional checks are done.
 */
export const ALLOWED_TIME_WINDOW = undefined;

/**
 * What to do if a table isn't found, options include "retry".
 * Anything else just stops after the first round of attempts.
 */
export const ON_FAILURE = "retry";
/** If retrying, the speed at which to retry */
export const RETRY_DELAY = 1000;

/**
 * If you want to really hammer the site with a short retry delay,
 * consider setting a delayed start. It'll log you in first, but not
 * start trying to book until the specified time.
 *
 * Examples "11:59:55pm" or "now"
 */
export const START_AT = "12:48:00pm";
/**
 * Examples "12:01:00am" or "never"
 */
export const STOP_AT = "12:48:30pm";
