import { formatCsvDate } from "./dates";
import { formatKopecksForCsv } from "./money";
import type { Category, Transaction, TransactionType } from "./types";

export type CsvRow = {
  date: string;
  type: string;
  category: string;
  amount: string;
  note: string;
};

const typeLabel: Record<TransactionType, string> = {
  expense: "Расход",
  income: "Доход",
};

function escapeCell(value: string): string {
  if (/[";\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function transactionsToCsvRows(
  transactions: readonly Transaction[],
  categories: readonly Category[],
): CsvRow[] {
  const names = new Map(categories.map((category) => [category.id, category.name]));
  return transactions.map((transaction) => ({
    date: formatCsvDate(transaction.date),
    type: typeLabel[transaction.type],
    category: names.get(transaction.categoryId) ?? "Без категории",
    amount: formatKopecksForCsv(transaction.amount),
    note: transaction.note,
  }));
}

export function buildCsv(rows: readonly CsvRow[]): string {
  const lines = [
    ["дата", "тип", "категория", "сумма", "заметка"].join(";"),
    ...rows.map((row) =>
      [row.date, row.type, row.category, row.amount, row.note].map(escapeCell).join(";"),
    ),
  ];
  return `\uFEFF${lines.join("\r\n")}`;
}
