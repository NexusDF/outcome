import { monthKey } from "./dates";
import type {
  Category,
  Transaction,
  TransactionFilters,
  TransactionInput,
} from "./types";

export function validateTransaction(input: TransactionInput): string | null {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    return "Введите сумму больше нуля";
  }
  if (input.categoryId.length === 0) {
    return "Выберите категорию";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return "Выберите дату";
  }
  return null;
}

export function monthBalance(transactions: readonly Transaction[], month: string): number {
  return transactions.reduce((sum, transaction) => {
    if (monthKey(transaction.date) !== month) {
      return sum;
    }
    return sum + (transaction.type === "income" ? transaction.amount : -transaction.amount);
  }, 0);
}

export function balanceChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return null;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function spentByCategory(
  transactions: readonly Transaction[],
  month: string,
): Map<string, number> {
  const spent = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.type !== "expense" || monthKey(transaction.date) !== month) {
      continue;
    }
    spent.set(
      transaction.categoryId,
      (spent.get(transaction.categoryId) ?? 0) + transaction.amount,
    );
  }
  return spent;
}

export function topExpenseCategories(
  transactions: readonly Transaction[],
  categories: readonly Category[],
  month: string,
  limit = 3,
): Array<{ category: Category; amount: number }> {
  const names = new Map(categories.map((category) => [category.id, category]));
  return [...spentByCategory(transactions, month).entries()]
    .flatMap(([categoryId, amount]) => {
      const category = names.get(categoryId);
      return category ? [{ category, amount }] : [];
    })
    .sort((left, right) => right.amount - left.amount)
    .slice(0, limit);
}

export function filterTransactions(
  transactions: readonly Transaction[],
  categories: readonly Category[],
  filters: TransactionFilters,
): Transaction[] {
  const names = new Map(categories.map((category) => [category.id, category.name]));
  const query = filters.query.trim().toLocaleLowerCase("ru");
  const filtered = transactions.filter((transaction) => {
    if (filters.from && transaction.date < filters.from) {
      return false;
    }
    if (filters.to && transaction.date > filters.to) {
      return false;
    }
    if (filters.categoryId && transaction.categoryId !== filters.categoryId) {
      return false;
    }
    if (filters.type && transaction.type !== filters.type) {
      return false;
    }
    if (query.length > 0 && !transaction.note.toLocaleLowerCase("ru").includes(query)) {
      return false;
    }
    return true;
  });

  const direction = filters.sortDirection === "asc" ? 1 : -1;
  return filtered.sort((left, right) => {
    if (filters.sortField === "amount") {
      return (left.amount - right.amount) * direction;
    }
    if (filters.sortField === "category") {
      const byName = (names.get(left.categoryId) ?? "").localeCompare(
        names.get(right.categoryId) ?? "",
        "ru",
      );
      return byName * direction;
    }
    const byDate = left.date.localeCompare(right.date);
    if (byDate !== 0) {
      return byDate * direction;
    }
    return right.createdAt.localeCompare(left.createdAt);
  });
}
