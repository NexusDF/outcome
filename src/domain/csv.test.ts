import { describe, expect, it } from "vitest";
import { buildCsv, transactionsToCsvRows } from "./csv";
import { createDefaultCategories } from "./categories";
import type { Transaction } from "./types";

const transaction: Transaction = {
  id: "tx-1",
  amount: 123456,
  type: "expense",
  categoryId: "cat-food",
  date: "2026-03-18",
  note: 'Обед; "кафе"\nвторая строка',
  recurringId: null,
  occurrenceDate: null,
  createdAt: "2026-03-18T00:00:00.000Z",
  updatedAt: "2026-03-18T00:00:00.000Z",
};

describe("buildCsv", () => {
  it("ставит BOM, точку с запятой и экранирует кавычки", () => {
    const csv = buildCsv(
      transactionsToCsvRows([transaction], createDefaultCategories("2026-01-01T00:00:00.000Z")),
    );
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("дата;тип;категория;сумма;заметка");
    expect(csv).toContain('18.03.2026;Расход;Продукты;1234,56;"Обед; ""кафе""\nвторая строка"');
  });
});
