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
export const DATES = "11/5 - 11/18";

/** Your ideal time for the reservation */
export const BEST_TIME = "7:00pm";
/** Your preferred times for the reservation */
export const PREFERRED_TIME_WINDOW = "6:30pm - 8:30pm";
/**
 * Additional allowed times for the reservation. If you specified multiple dates,
 * will check all the dates for the preferred times before checking the allowed.
 */
export const ALLOWED_TIME_WINDOW: string | undefined = undefined;

/** What to do if a table isn't found */
export const ON_FAILURE: "STOP" | "RETRY" = "STOP";
/** If retrying, the speed at which to retry */
export const RETRY_DELAY = 100;

/**
 * Examples "12:00:00pm" or "NOW"
 */
export const START_AT = "NOW";
/**
 * Examples "12:01:00am" or "NEVER"
 */
export const STOP_AT = "NEVER";
