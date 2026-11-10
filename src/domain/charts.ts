import { lastMonths, monthKey } from "./dates";
import type { Category, Transaction } from "./types";

export type MonthPoint = {
  month: string;
  income: number;
  expense: number;
};

export type CategorySlice = {
  id: string;
  name: string;
  color: string;
  amount: number;
};

export function monthlySeries(
  transactions: readonly Transaction[],
  endMonth: string,
  count = 12,
): MonthPoint[] {
  const months = lastMonths(endMonth, count);
  const totals = new Map(months.map((month) => [month, { income: 0, expense: 0 }]));
  for (const transaction of transactions) {
    const bucket = totals.get(monthKey(transaction.date));
    if (!bucket) {
      continue;
    }
    bucket[transaction.type] += transaction.amount;
  }
  return months.map((month) => {
    const bucket = totals.get(month) ?? { income: 0, expense: 0 };
    return { month, income: bucket.income, expense: bucket.expense };
  });
}

export function categorySlices(
  transactions: readonly Transaction[],
  categories: readonly Category[],
  month: string,
): CategorySlice[] {
  const names = new Map(categories.map((category) => [category.id, category]));
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.type !== "expense" || monthKey(transaction.date) !== month) {
      continue;
    }
    totals.set(
      transaction.categoryId,
      (totals.get(transaction.categoryId) ?? 0) + transaction.amount,
    );
  }
  return [...totals.entries()]
    .flatMap(([id, amount]) => {
      const category = names.get(id);
      return category
        ? [{ id, name: category.name, color: category.color, amount }]
        : [];
    })
    .sort((left, right) => right.amount - left.amount);
}
