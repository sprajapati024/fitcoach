const MS_IN_DAY = 86_400_000;

export function parseUtcDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date string: ${date}`);
  }
  return new Date(`${date}T00:00:00Z`);
}

export function formatUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getLocalDate(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return new Date(`${get("year")}-${get("month")}-${get("day")}T00:00:00`);
}

export function getTodayIndex(params: {
  startDate: string;
  timezone: string;
  totalDays: number;
  now?: Date;
}) {
  const { startDate, timezone, totalDays } = params;
  const now = params.now ?? new Date();
  const startUtc = parseUtcDate(startDate);
  const startLocal = getLocalDate(startUtc, timezone);
  const localNow = getLocalDate(now, timezone);

  const diff = Math.floor((localNow.getTime() - startLocal.getTime()) / MS_IN_DAY);
  const dayIndex = Math.max(-1, Math.min(diff, totalDays - 1));

  return {
    dayIndex,
    isoDate: formatUtcDate(localNow),
    isBeforeStart: diff < 0,
    isAfterEnd: diff >= totalDays,
  };
}

export function shiftUtcDate(date: string, offsetDays: number) {
  const base = parseUtcDate(date);
  const shifted = new Date(base.getTime() + offsetDays * MS_IN_DAY);
  return formatUtcDate(shifted);
}
