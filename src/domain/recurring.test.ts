import { describe, expect, it } from "vitest";
import { createDefaultCategories } from "./categories";
import { occurrenceDates, planRecurring } from "./recurring";
import type { LedgerSnapshot, RecurringPayment } from "./types";

const now = "2026-03-01T00:00:00.000Z";

function payment(patch: Partial<RecurringPayment> = {}): RecurringPayment {
  return {
    id: "rent",
    amount: 150000,
    type: "expense",
    categoryId: "cat-home",
    frequency: "monthly",
    startDate: "2026-01-31",
    endDate: null,
    enabled: true,
    createdAt: now,
    updatedAt: now,
    ...patch,
  };
}

function snapshot(recurring: RecurringPayment[], occurrences: LedgerSnapshot["occurrences"] = []): LedgerSnapshot {
  return {
    categories: createDefaultCategories(now),
    transactions: [],
    recurring,
    occurrences,
    limits: {},
    theme: "light",
  };
}

describe("occurrenceDates", () => {
  it("сохраняет день месяца и обрезает февраль", () => {
    expect(occurrenceDates(payment(), "2026-03-31")).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
    ]);
  });

  it("в високосный февраль ставит 29-е и в марте возвращает 31-е", () => {
    expect(occurrenceDates(payment({ startDate: "2024-01-31" }), "2024-03-31")).toEqual([
      "2024-01-31",
      "2024-02-29",
      "2024-03-31",
    ]);
  });

  it("не создаёт даты выключенного шаблона и после даты окончания", () => {
    expect(occurrenceDates(payment({ enabled: false }), "2026-03-31")).toEqual([]);
    expect(occurrenceDates(payment({ endDate: "2026-02-15" }), "2026-03-31")).toEqual([
      "2026-01-31",
    ]);
  });

  it("считает неделю от даты начала", () => {
    expect(
      occurrenceDates(
        payment({ frequency: "weekly", startDate: "2026-03-01", endDate: "2026-03-16" }),
        "2026-04-01",
      ),
    ).toEqual(["2026-03-01", "2026-03-08", "2026-03-15"]);
  });
});

describe("planRecurring", () => {
  it("не создаёт повторно уже отмеченное вхождение", () => {
    const planned = planRecurring(
      snapshot(
        [payment({ startDate: "2026-03-01" })],
        [{ recurringId: "rent", occurrenceDate: "2026-03-01" }],
      ),
      "2026-03-01",
      now,
    );
    expect(planned.transactions).toEqual([]);
  });

  it("создаёт операцию со ссылкой на шаблон и датой вхождения", () => {
    const planned = planRecurring(
      snapshot([payment({ startDate: "2026-03-02", frequency: "daily" })]),
      "2026-03-03",
      now,
    );
    expect(planned.transactions.map((transaction) => transaction.id)).toEqual([
      "rent_2026-03-02",
      "rent_2026-03-03",
    ]);
    expect(planned.transactions[0]?.recurringId).toBe("rent");
    expect(planned.transactions[0]?.occurrenceDate).toBe("2026-03-02");
  });
});
