/**
 * ==========================
 * Edit these directly for your booking or use environment variables to override
 *
 * If you know reservations for a new day open at a certain time:
 * - specify that single day
 * - make preferred and allowed times the same.
 * - set FAST_RETRY_DELAY to something faster and FAST_RETRY_TIME to that time
 * ==========================
 */

/** The reservation url. Search params in the url will be ignored. */
export const BOOKING_URL = "https://resy.com/cities/new-york-ny/venues/tatiana?date=2024-09-26";
/** Number of seats */
export const SEATS = 2;
/** If there's a robot check, the human has to finish the booking by hand. */
export const REQUIRES_HUMAN = true;

/**
 * Date or dates you're willing to book. Will accept ranges "10/23 - 10/25",
 * lists "10/23, 10/25", or combos of both. A booking will be made for only
 * one of the dates. Write the dates in the order you'd prefer.
 */
export const DATES = "10/24";

/** Your ideal time for the reservation */
export const BEST_TIME = "6:00pm";
/** Your preferred times for the reservation */
export const PREFERRED_TIME_WINDOW = "5:00pm - 8:00pm";
/**
 * Your allowed times for the reservation. If you specified multiple dates,
 * will check all the dates for the preferred times before checking the
 * allowed times. If it's same or narrower than the preferred window, no
 * additional checks are done.
 */
export const ALLOWED_TIME_WINDOW = "5:00pm - 8:00pm";

/**
 * What to do if a table isn't found, options include "retry".
 * Anything else just stops after the first round of attempts.
 */
export const ON_FAILURE = "retry";
/** If retrying, the speed at which to retry */
export const RETRY_DELAY = 250;
/**
 * If you want to really hammer the site with a short retry delay,
 * consider setting a delayed start. It'll log you in first, but not
 * start trying to book until the specified time.
 *
 * Examples "11:59:55am" or "now"
 */
export const START_AT = "11:59:58am";
