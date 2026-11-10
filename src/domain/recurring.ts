import type {
  LedgerSnapshot,
  PostedOccurrence,
  RecurringPayment,
  Transaction,
} from "./types";

export function occurrenceKey(recurringId: string, occurrenceDate: string): string {
  return `${recurringId}_${occurrenceDate}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function isoDate(year: number, month: number, day: number): string {
  const clamped = Math.min(day, daysInMonth(year, month));
  return `${year}-${String(month).padStart(2, "0")}-${String(clamped).padStart(2, "0")}`;
}

function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function occurrenceDates(payment: RecurringPayment, today: string): string[] {
  if (!payment.enabled || payment.startDate > today) {
    return [];
  }
  const end = payment.endDate && payment.endDate < today ? payment.endDate : today;
  if (payment.startDate > end) {
    return [];
  }

  if (payment.frequency === "daily" || payment.frequency === "weekly") {
    const step = payment.frequency === "daily" ? 1 : 7;
    const dates: string[] = [];
    let cursor = payment.startDate;
    while (cursor <= end) {
      dates.push(cursor);
      cursor = addDays(cursor, step);
    }
    return dates;
  }

  const year = Number(payment.startDate.slice(0, 4));
  const month = Number(payment.startDate.slice(5, 7));
  const day = Number(payment.startDate.slice(8, 10));
  const step = payment.frequency === "monthly" ? 1 : 12;
  const dates: string[] = [];
  let cursorYear = year;
  let cursorMonth = month;
  let cursor = isoDate(cursorYear, cursorMonth, day);
  while (cursor <= end) {
    if (cursor >= payment.startDate) {
      dates.push(cursor);
    }
    cursorMonth += step;
    cursorYear += Math.floor((cursorMonth - 1) / 12);
    cursorMonth = ((cursorMonth - 1) % 12) + 1;
    cursor = isoDate(cursorYear, cursorMonth, day);
  }
  return dates;
}

export function planRecurring(
  snapshot: LedgerSnapshot,
  today: string,
  now: string,
): { transactions: Transaction[]; occurrences: PostedOccurrence[] } {
  const posted = new Set(
    snapshot.occurrences.map((occurrence) =>
      occurrenceKey(occurrence.recurringId, occurrence.occurrenceDate),
    ),
  );
  const transactions: Transaction[] = [];
  const occurrences: PostedOccurrence[] = [];

  for (const payment of snapshot.recurring) {
    for (const date of occurrenceDates(payment, today)) {
      const key = occurrenceKey(payment.id, date);
      if (posted.has(key)) {
        continue;
      }
      posted.add(key);
      transactions.push({
        id: key,
        amount: payment.amount,
        type: payment.type,
        categoryId: payment.categoryId,
        date,
        note: "",
        recurringId: payment.id,
        occurrenceDate: date,
        createdAt: now,
        updatedAt: now,
      });
      occurrences.push({ recurringId: payment.id, occurrenceDate: date });
    }
  }

  return { transactions, occurrences };
}
