import { describe, expect, it } from "vitest";
import { categorySlices, monthlySeries } from "./charts";
import { createDefaultCategories } from "./categories";
import type { Transaction } from "./types";

function transaction(patch: Partial<Transaction>): Transaction {
  return {
    id: "tx",
    amount: 10000,
    type: "expense",
    categoryId: "cat-food",
    date: "2026-03-01",
    note: "",
    recurringId: null,
    occurrenceDate: null,
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
    ...patch,
  };
}

describe("monthlySeries", () => {
  it("строит 12 месяцев и отделяет доходы от расходов", () => {
    const series = monthlySeries(
      [
        transaction({ id: "a", amount: 5000, date: "2026-03-02" }),
        transaction({ id: "b", type: "income", amount: 8000, date: "2026-03-04" }),
        transaction({ id: "c", amount: 1500, date: "2025-04-01" }),
      ],
      "2026-03",
    );
    expect(series).toHaveLength(12);
    expect(series[11]).toEqual({ month: "2026-03", income: 8000, expense: 5000 });
    expect(series[0]).toEqual({ month: "2025-04", income: 0, expense: 1500 });
  });
});

describe("categorySlices", () => {
  it("суммирует расходы выбранного месяца по категориям", () => {
    const slices = categorySlices(
      [
        transaction({ id: "a", amount: 2000 }),
        transaction({ id: "b", amount: 3000, categoryId: "cat-transport" }),
        transaction({ id: "c", type: "income", amount: 9000 }),
        transaction({ id: "d", amount: 4000, date: "2026-02-01" }),
      ],
      createDefaultCategories("2026-01-01T00:00:00.000Z"),
      "2026-03",
    );
    expect(slices.map((slice) => [slice.name, slice.amount])).toEqual([
      ["Транспорт", 3000],
      ["Продукты", 2000],
    ]);
  });
});
