import { applyDeleteCategory, createDefaultCategories } from "../domain/categories";
import { planRecurring } from "../domain/recurring";
import type {
  Category,
  LedgerSnapshot,
  PostedOccurrence,
  RecurringPayment,
  ThemePreference,
  Transaction,
  TransactionInput,
} from "../domain/types";
import type { DeleteCategoryResult, LedgerClient } from "./client";

const STORAGE_KEY = "ledger.v1";

type LedgerStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

function browserStore(): LedgerStore {
  if (typeof localStorage === "undefined") {
    throw new Error("Браузер не сохраняет данные");
  }
  return localStorage;
}

function createId(): string {
  return crypto.randomUUID();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function nonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

function readCategory(value: unknown): Category | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = text(value.id);
  const name = text(value.name);
  const color = text(value.color);
  const emoji = text(value.emoji);
  const createdAt = text(value.createdAt);
  const updatedAt = text(value.updatedAt);
  if (!id || !name || !color || !emoji || !createdAt || !updatedAt) {
    return null;
  }
  return { id, name, color, emoji, createdAt, updatedAt };
}

function readTransaction(value: unknown): Transaction | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = text(value.id);
  const amount = positiveInteger(value.amount);
  const type = value.type === "expense" || value.type === "income" ? value.type : null;
  const categoryId = text(value.categoryId);
  const date = text(value.date);
  const note = text(value.note);
  const createdAt = text(value.createdAt);
  const updatedAt = text(value.updatedAt);
  if (!id || !amount || !type || !categoryId || !date || note === null || !createdAt || !updatedAt) {
    return null;
  }
  return {
    id,
    amount,
    type,
    categoryId,
    date,
    note,
    recurringId: text(value.recurringId),
    occurrenceDate: text(value.occurrenceDate),
    createdAt,
    updatedAt,
  };
}

function readRecurring(value: unknown): RecurringPayment | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = text(value.id);
  const amount = positiveInteger(value.amount);
  const type = value.type === "expense" || value.type === "income" ? value.type : null;
  const categoryId = text(value.categoryId);
  const frequency = value.frequency;
  const startDate = text(value.startDate);
  const createdAt = text(value.createdAt);
  const updatedAt = text(value.updatedAt);
  const known =
    frequency === "daily" ||
    frequency === "weekly" ||
    frequency === "monthly" ||
    frequency === "yearly";
  if (!id || !amount || !type || !categoryId || !known || !startDate || !createdAt || !updatedAt) {
    return null;
  }
  return {
    id,
    amount,
    type,
    categoryId,
    frequency,
    startDate,
    endDate: text(value.endDate),
    enabled: value.enabled === true,
    createdAt,
    updatedAt,
  };
}

function readOccurrence(value: unknown): PostedOccurrence | null {
  if (!isRecord(value)) {
    return null;
  }
  const recurringId = text(value.recurringId);
  const occurrenceDate = text(value.occurrenceDate);
  if (!recurringId || !occurrenceDate) {
    return null;
  }
  return { recurringId, occurrenceDate };
}

function readLimits(value: unknown): Record<string, number> {
  if (!isRecord(value)) {
    return {};
  }
  const limits: Record<string, number> = {};
  for (const [key, amount] of Object.entries(value)) {
    const parsed = nonNegativeInteger(amount);
    if (parsed !== null) {
      limits[key] = parsed;
    }
  }
  return limits;
}

function readTheme(value: unknown): ThemePreference {
  return value === "dark" || value === "system" || value === "light" ? value : "light";
}

function freshSnapshot(now: string): LedgerSnapshot {
  return {
    categories: createDefaultCategories(now),
    transactions: [],
    recurring: [],
    occurrences: [],
    limits: {},
    theme: "light",
  };
}

function parseSnapshot(raw: string, now: string): LedgerSnapshot | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || !Array.isArray(value.categories)) {
      return null;
    }
    const categories = value.categories.flatMap((item) => {
      const category = readCategory(item);
      return category ? [category] : [];
    });
    return {
      categories: categories.length > 0 ? categories : createDefaultCategories(now),
      transactions: Array.isArray(value.transactions)
        ? value.transactions.flatMap((item) => {
            const transaction = readTransaction(item);
            return transaction ? [transaction] : [];
          })
        : [],
      recurring: Array.isArray(value.recurring)
        ? value.recurring.flatMap((item) => {
            const payment = readRecurring(item);
            return payment ? [payment] : [];
          })
        : [],
      occurrences: Array.isArray(value.occurrences)
        ? value.occurrences.flatMap((item) => {
            const occurrence = readOccurrence(item);
            return occurrence ? [occurrence] : [];
          })
        : [],
      limits: readLimits(value.limits),
      theme: readTheme(value.theme),
    };
  } catch {
    return null;
  }
}

function persist(store: LedgerStore, snapshot: LedgerSnapshot): void {
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (caught) {
    const quota =
      caught instanceof DOMException &&
      (caught.name === "QuotaExceededError" || caught.name === "NS_ERROR_DOM_QUOTA_REACHED");
    throw new Error(
      quota
        ? "Не хватает места в браузере, чтобы сохранить данные"
        : "Не удалось сохранить данные в браузере",
    );
  }
}

function loadSnapshot(store: LedgerStore, now: string): LedgerSnapshot {
  const raw = store.getItem(STORAGE_KEY);
  if (raw === null) {
    const initial = freshSnapshot(now);
    persist(store, initial);
    return initial;
  }
  return parseSnapshot(raw, now) ?? freshSnapshot(now);
}

export function createLocalLedger(now: string, store: LedgerStore = browserStore()): LedgerClient {
  let snapshot = loadSnapshot(store, now);
  const listeners = new Set<(value: LedgerSnapshot) => void>();

  function emit(): void {
    for (const listener of listeners) {
      listener(snapshot);
    }
  }

  function commit(next: LedgerSnapshot): void {
    persist(store, next);
    snapshot = next;
    emit();
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
    async whenReady() {},
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot);
      const onStorage = (event: StorageEvent) => {
        if (event.key !== STORAGE_KEY || event.storageArea !== localStorage) {
          return;
        }
        snapshot = event.newValue ? (parseSnapshot(event.newValue, now) ?? freshSnapshot(now)) : freshSnapshot(now);
        emit();
      };
      const sync = typeof window !== "undefined" && store === localStorage;
      if (sync) {
        window.addEventListener("storage", onStorage);
      }
      return () => {
        listeners.delete(listener);
        if (sync) {
          window.removeEventListener("storage", onStorage);
        }
      };
    },
    async catchUp(today, caughtAt) {
      const planned = planRecurring(snapshot, today, caughtAt);
      if (planned.transactions.length === 0) {
        return 0;
      }
      commit({
        ...snapshot,
        transactions: [...snapshot.transactions, ...planned.transactions],
        occurrences: [...snapshot.occurrences, ...planned.occurrences],
      });
      return planned.transactions.length;
    },
    async addTransaction(input, createdAt) {
      commit({
        ...snapshot,
        transactions: [transactionFrom(createId(), input, createdAt), ...snapshot.transactions],
      });
    },
    async updateTransaction(id, input, updatedAt) {
      commit({
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
      });
    },
    async deleteTransaction(id) {
      commit({
        ...snapshot,
        transactions: snapshot.transactions.filter((transaction) => transaction.id !== id),
      });
    },
    async addCategory(input, createdAt) {
      commit({
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
      });
    },
    async updateCategory(id, input, updatedAt) {
      commit({
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
      });
    },
    async deleteCategory(id, transferToId, updatedAt): Promise<DeleteCategoryResult> {
      const result = applyDeleteCategory(snapshot, id, transferToId, updatedAt);
      if (!result.ok) {
        return result;
      }
      commit(result.snapshot);
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
      commit({ ...snapshot, recurring: [...snapshot.recurring, payment] });
    },
    async updateRecurring(id, input, updatedAt) {
      commit({
        ...snapshot,
        recurring: snapshot.recurring.map((payment) =>
          payment.id === id ? { ...payment, ...input, updatedAt } : payment,
        ),
      });
    },
    async deleteRecurring(id) {
      commit({
        ...snapshot,
        recurring: snapshot.recurring.filter((payment) => payment.id !== id),
      });
    },
    async setRecurringEnabled(id, enabled, updatedAt) {
      commit({
        ...snapshot,
        recurring: snapshot.recurring.map((payment) =>
          payment.id === id ? { ...payment, enabled, updatedAt } : payment,
        ),
      });
    },
    async setLimit(categoryId, amount) {
      const limits = { ...snapshot.limits };
      if (amount === null) {
        delete limits[categoryId];
      } else {
        limits[categoryId] = amount;
      }
      commit({ ...snapshot, limits });
    },
    async setTheme(theme: ThemePreference) {
      commit({ ...snapshot, theme });
    },
  };
}
