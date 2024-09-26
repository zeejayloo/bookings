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

export const prettifyDelayUntil = (time: Date) => {
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
