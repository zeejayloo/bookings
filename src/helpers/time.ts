export const prettifyDelay = (delay: number) => {
  if (delay < 1000) {
    return `${delay.toFixed(0)} millis`;
  }
  const seconds = delay / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(0)} second(s)`;
  }
  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${minutes.toFixed(0)} minute(s)`;
  }
  const hours = minutes / 60;
  const remainingMinutes = minutes % 60;
  return `${hours.toFixed(0)} hour(s) and ${remainingMinutes.toFixed(0)} minute(s)`;
};

export const prettifyTime = (time: Date) => {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const period = hours >= 12 ? "pm" : "am";
  // Ensure two digits
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = seconds.toString().padStart(2, "0");
  let adjustedHour = hours % 12 || 12; // Convert 0 or 12 to 12
  return `${adjustedHour}:${formattedMinutes}:${formattedSeconds}${period}`;
};

export const parseFutureTimeWithSeconds = (timeStr: string) => {
  const [time, modifier] = timeStr.split(/(am|pm)/i);
  let [hour, minute, second] = time.split(":").map(Number);
  if (second === undefined) {
    second = 0;
  }
  if (modifier.toLowerCase() === "pm" && hour < 12) {
    hour += 12;
  } else if (modifier.toLowerCase() === "am" && hour === 12) {
    hour = 0;
  }
  const now = new Date();
  const date = new Date(now);
  date.setHours(hour, minute, second);
  // Ensure startAt is in the future
  if (date < now) {
    date.setDate(date.getDate() + 1);
    // Again in case of daylight savings!?
    date.setHours(hour, minute, second);
  }
  return date;
};
