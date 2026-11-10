import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export function todayIso(now = new Date()): string {
  return format(now, "yyyy-MM-dd");
}

export function currentMonth(now = new Date()): string {
  return format(now, "yyyy-MM");
}

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [yearText, monthText] = month.split("-");
  const index = Number(yearText) * 12 + (Number(monthText) - 1) + delta;
  const year = Math.floor(index / 12);
  const nextMonth = (index % 12) + 1;
  return `${year}-${String(nextMonth).padStart(2, "0")}`;
}

export function formatMonth(month: string): string {
  return format(parseISO(`${month}-01`), "LLLL yyyy", { locale: ru });
}

export function formatMonthShort(month: string): string {
  return format(parseISO(`${month}-01`), "LLL yy", { locale: ru });
}

export function formatDay(isoDate: string, now = new Date()): string {
  if (isoDate === todayIso(now)) {
    return "Сегодня";
  }
  return format(parseISO(isoDate), "d MMM yyyy", { locale: ru });
}

export function formatCsvDate(isoDate: string): string {
  return format(parseISO(isoDate), "dd.MM.yyyy");
}

export function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 5) {
    return "Доброй ночи";
  }
  if (hour < 12) {
    return "Доброе утро";
  }
  if (hour < 18) {
    return "Добрый день";
  }
  return "Добрый вечер";
}

export function lastMonths(endMonth: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) =>
    shiftMonth(endMonth, index - (count - 1)),
  );
}
