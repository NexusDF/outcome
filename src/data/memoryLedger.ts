import { applyDeleteCategory, createDefaultCategories } from "../domain/categories";
import { planRecurring } from "../domain/recurring";
import type {
  LedgerSnapshot,
  RecurringPayment,
  ThemePreference,
  Transaction,
  TransactionInput,
} from "../domain/types";
import type { DeleteCategoryResult, LedgerClient } from "./client";

function createId(): string {
  return crypto.randomUUID();
}

export function createMemoryLedger(now: string): LedgerClient {
  let snapshot: LedgerSnapshot = {
    categories: createDefaultCategories(now),
    transactions: [],
    recurring: [],
    occurrences: [],
    limits: {},
    theme: "light",
  };
  const listeners = new Set<(value: LedgerSnapshot) => void>();

  function emit(): void {
    for (const listener of listeners) {
      listener(snapshot);
    }
  }

  function transactionFrom(id: string, input: TransactionInput, createdAt: string): Transaction {
    return {
      id,
      ...input,
      note: input.note.trim(),
      recurringId: null,
      occurrenceDate: null,
      createdAt,
      updatedAt: createdAt,
    };
  }

  return {
    mode: "memory",
    async whenReady() {},
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot);
      return () => listeners.delete(listener);
    },
    async catchUp(today, caughtAt) {
      const planned = planRecurring(snapshot, today, caughtAt);
      if (planned.transactions.length === 0) {
        return 0;
      }
      snapshot = {
        ...snapshot,
        transactions: [...snapshot.transactions, ...planned.transactions],
        occurrences: [...snapshot.occurrences, ...planned.occurrences],
      };
      emit();
      return planned.transactions.length;
    },
    async addTransaction(input, createdAt) {
      snapshot = {
        ...snapshot,
        transactions: [transactionFrom(createId(), input, createdAt), ...snapshot.transactions],
      };
      emit();
    },
    async updateTransaction(id, input, updatedAt) {
      snapshot = {
        ...snapshot,
        transactions: snapshot.transactions.map((transaction) =>
          transaction.id === id
            ? {
                ...transaction,
                ...input,
                note: input.note.trim(),
                updatedAt,
              }
            : transaction,
        ),
      };
      emit();
    },
    async deleteTransaction(id) {
      snapshot = {
        ...snapshot,
        transactions: snapshot.transactions.filter((transaction) => transaction.id !== id),
      };
      emit();
    },
    async addCategory(input, createdAt) {
      snapshot = {
        ...snapshot,
        categories: [
          ...snapshot.categories,
          {
            id: createId(),
            name: input.name.trim(),
            color: input.color,
            emoji: input.emoji.trim(),
            createdAt,
            updatedAt: createdAt,
          },
        ],
      };
      emit();
    },
    async updateCategory(id, input, updatedAt) {
      snapshot = {
        ...snapshot,
        categories: snapshot.categories.map((category) =>
          category.id === id
            ? {
                ...category,
                name: input.name.trim(),
                color: input.color,
                emoji: input.emoji.trim(),
                updatedAt,
              }
            : category,
        ),
      };
      emit();
    },
    async deleteCategory(id, transferToId, updatedAt): Promise<DeleteCategoryResult> {
      const result = applyDeleteCategory(snapshot, id, transferToId, updatedAt);
      if (!result.ok) {
        return result;
      }
      snapshot = result.snapshot;
      emit();
      return { ok: true };
    },
    async addRecurring(input, createdAt) {
      const payment: RecurringPayment = {
        id: createId(),
        ...input,
        endDate: input.endDate,
        createdAt,
        updatedAt: createdAt,
      };
      snapshot = { ...snapshot, recurring: [...snapshot.recurring, payment] };
      emit();
    },
    async updateRecurring(id, input, updatedAt) {
      snapshot = {
        ...snapshot,
        recurring: snapshot.recurring.map((payment) =>
          payment.id === id ? { ...payment, ...input, updatedAt } : payment,
        ),
      };
      emit();
    },
    async deleteRecurring(id) {
      snapshot = {
        ...snapshot,
        recurring: snapshot.recurring.filter((payment) => payment.id !== id),
      };
      emit();
    },
    async setRecurringEnabled(id, enabled, updatedAt) {
      snapshot = {
        ...snapshot,
        recurring: snapshot.recurring.map((payment) =>
          payment.id === id ? { ...payment, enabled, updatedAt } : payment,
        ),
      };
      emit();
    },
    async setLimit(categoryId, amount) {
      const limits = { ...snapshot.limits };
      if (amount === null) {
        delete limits[categoryId];
      } else {
        limits[categoryId] = amount;
      }
      snapshot = { ...snapshot, limits };
      emit();
    },
    async setTheme(theme: ThemePreference) {
      snapshot = { ...snapshot, theme };
      emit();
    },
  };
}
