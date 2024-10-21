export type BookingDate = {
  year: number;
  month: number;
  day: number;
};

const getCurrentYear = (month: number, day: number): number => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDate = now.getDate();

  // If the date is in the past (relative to today), use next year
  if (month < currentMonth || (month === currentMonth && day < currentDate)) {
    return currentYear + 1;
  }
  return currentYear;
};

const parseSingleDate = (dateStr: string): BookingDate => {
  const [month, day] = dateStr.split("/").map(Number);
  const year = getCurrentYear(month, day);
  return { year, month, day };
};

export const parseBookingDates = (datesParam: string): BookingDate[] => {
  const dates: BookingDate[] = [];

  const parts = datesParam.split(",").map((part) => part.trim());
  for (const part of parts) {
    if (part.includes("-")) {
      // Handle range (e.g. "10/23 - 10/25")
      const [startStr, endStr] = part.split("-").map((p) => p.trim());
      const start = parseSingleDate(startStr);
      const end = parseSingleDate(endStr);

      const startDate = new Date(start.year, start.month - 1, start.day);
      const endDate = new Date(end.year, end.month - 1, end.day);

      // Loop over the range of days and add each day
      for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push({
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          day: d.getDate(),
        });
      }
    } else {
      // Handle individual dates (e.g. "10/23")
      dates.push(parseSingleDate(part));
    }
  }
  return dates;
};

export const prettifyBookingDate = ({ month, day, year }: BookingDate) => {
  if (year !== new Date().getFullYear()) {
    return `${month}/${day}/${year}`;
  }
  return `${month}/${day}`;
};

export const compareBookingDates = (date1: BookingDate, date2: BookingDate) => {
  if (date1.year !== date2.year) {
    return date1.year - date2.year;
  }
  if (date1.month !== date2.month) {
    return date1.month - date2.month;
  }
  return date1.day - date2.day;
};
