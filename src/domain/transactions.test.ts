import { describe, expect, it } from "vitest";
import { createDefaultCategories } from "./categories";
import { balanceChange, filterTransactions, monthBalance } from "./transactions";
import { emptyFilters, type Transaction } from "./types";

function transaction(patch: Partial<Transaction>): Transaction {
  return {
    id: "tx",
    amount: 1000,
    type: "expense",
    categoryId: "cat-food",
    date: "2026-03-10",
    note: "",
    recurringId: null,
    occurrenceDate: null,
    createdAt: "2026-03-10T00:00:00.000Z",
    updatedAt: "2026-03-10T00:00:00.000Z",
    ...patch,
  };
}

const categories = createDefaultCategories("2026-01-01T00:00:00.000Z");

describe("monthBalance", () => {
  it("вычитает расходы из доходов месяца", () => {
    expect(
      monthBalance(
        [
          transaction({ id: "in", type: "income", amount: 5000 }),
          transaction({ id: "out", amount: 1250 }),
          transaction({ id: "old", amount: 9000, date: "2026-02-01" }),
        ],
        "2026-03",
      ),
    ).toBe(3750);
  });
});

describe("balanceChange", () => {
  it("не считает процент от нуля", () => {
    expect(balanceChange(100, 0)).toBeNull();
    expect(balanceChange(150, 100)).toBe(50);
  });
});

describe("filterTransactions", () => {
  const transactions = [
    transaction({ id: "lunch", note: "Обед в кафе", date: "2026-03-02", amount: 45000 }),
    transaction({ id: "bus", categoryId: "cat-transport", note: "Метро", date: "2026-03-03", amount: 7000 }),
  ];

  it("фильтрует по заметке, категории и периоду", () => {
    const found = filterTransactions(transactions, categories, {
      ...emptyFilters,
      query: "обед",
      from: "2026-03-01",
      to: "2026-03-31",
      categoryId: "cat-food",
    });
    expect(found.map((item) => item.id)).toEqual(["lunch"]);
  });

  it("сортирует по сумме", () => {
    const sorted = filterTransactions(transactions, categories, {
      ...emptyFilters,
      sortField: "amount",
      sortDirection: "asc",
    });
    expect(sorted.map((item) => item.id)).toEqual(["bus", "lunch"]);
  });
});
