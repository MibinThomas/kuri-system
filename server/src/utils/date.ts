export function parseYearMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) throw new Error("Invalid YYYY-MM format");
  return { y, m };
}

export function addMonths(year: number, month: number, add: number) {
  // month: 1..12
  const total = (year * 12 + (month - 1)) + add;
  const newYear = Math.floor(total / 12);
  const newMonth = (total % 12) + 1;
  return { y: newYear, m: newMonth };
}

export function toYearMonth(year: number, month: number) {
  const mm = String(month).padStart(2, "0");
  return `${year}-${mm}`;
}

export function dueDateFor(year: number, month: number, day = 5) {
  // JS Date month is 0-based
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
}
