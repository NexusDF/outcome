import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  writeBatch,
  type DocumentData,
  type Firestore,
} from "firebase/firestore";
import { applyDeleteCategory, createDefaultCategories } from "../domain/categories";
import { planRecurring } from "../domain/recurring";
import type {
  Category,
  LedgerSnapshot,
  PostedOccurrence,
  RecurringPayment,
  Transaction,
} from "../domain/types";
import type { DeleteCategoryResult, LedgerClient } from "./client";

function text(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function integer(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function readCategory(id: string, data: DocumentData): Category | null {
  const name = text(data.name);
  const color = text(data.color);
  const emoji = text(data.emoji);
  const createdAt = text(data.createdAt);
  const updatedAt = text(data.updatedAt);
  if (!name || !color || !emoji || !createdAt || !updatedAt) {
    return null;
  }
  return { id, name, color, emoji, createdAt, updatedAt };
}

function readTransaction(id: string, data: DocumentData): Transaction | null {
  const amount = integer(data.amount);
  const type = data.type === "expense" || data.type === "income" ? data.type : null;
  const categoryId = text(data.categoryId);
  const date = text(data.date);
  const note = text(data.note);
  const createdAt = text(data.createdAt);
  const updatedAt = text(data.updatedAt);
  if (!amount || !type || !categoryId || !date || note === null || !createdAt || !updatedAt) {
    return null;
  }
  return {
    id,
    amount,
    type,
    categoryId,
    date,
    note,
    recurringId: text(data.recurringId),
    occurrenceDate: text(data.occurrenceDate),
    createdAt,
    updatedAt,
  };
}

function readRecurring(id: string, data: DocumentData): RecurringPayment | null {
  const amount = integer(data.amount);
  const type = data.type === "expense" || data.type === "income" ? data.type : null;
  const categoryId = text(data.categoryId);
  const frequency = data.frequency;
  const startDate = text(data.startDate);
  const createdAt = text(data.createdAt);
  const updatedAt = text(data.updatedAt);
  const known =
    frequency === "daily" ||
    frequency === "weekly" ||
    frequency === "monthly" ||
    frequency === "yearly";
  if (!amount || !type || !categoryId || !known || !startDate || !createdAt || !updatedAt) {
    return null;
  }
  return {
    id,
    amount,
    type,
    categoryId,
    frequency,
    startDate,
    endDate: text(data.endDate),
    enabled: data.enabled === true,
    createdAt,
    updatedAt,
  };
}

function readOccurrence(data: DocumentData): PostedOccurrence | null {
  const recurringId = text(data.recurringId);
  const occurrenceDate = text(data.occurrenceDate);
  if (!recurringId || !occurrenceDate) {
    return null;
  }
  return { recurringId, occurrenceDate };
}

async function commitAll(
  db: Firestore,
  writes: Array<(batch: ReturnType<typeof writeBatch>) => void>,
): Promise<void> {
  for (let index = 0; index < writes.length; index += 400) {
    const batch = writeBatch(db);
    for (const write of writes.slice(index, index + 400)) {
      write(batch);
    }
    await batch.commit();
  }
}

export function createFirebaseLedger(db: Firestore, uid: string): LedgerClient {
  const base = `users/${uid}`;
  let snapshot: LedgerSnapshot = {
    categories: [],
    transactions: [],
    recurring: [],
    occurrences: [],
    limits: {},
    theme: "light",
  };
  const listeners = new Set<(value: LedgerSnapshot) => void>();
  let ready = false;
  let resolveReady = () => {};
  const readyPromise = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });

  function emit(): void {
    for (const listener of listeners) {
      listener(snapshot);
    }
  }

  async function ensureSeed(now: string): Promise<void> {
    const settingsRef = doc(db, `${base}/settings/app`);
    const settings = await getDoc(settingsRef);
    if (settings.exists()) {
      return;
    }
    const batch = writeBatch(db);
    for (const category of createDefaultCategories(now)) {
      batch.set(doc(db, `${base}/categories/${category.id}`), category);
    }
    batch.set(settingsRef, { theme: "light", limits: {}, seeded: true });
    await batch.commit();
  }

  async function saveSettings(): Promise<void> {
    await setDoc(
      doc(db, `${base}/settings/app`),
      { theme: snapshot.theme, limits: snapshot.limits, seeded: true },
      { merge: true },
    );
  }

  return {
    mode: "firebase",
    whenReady: () => readyPromise,
    subscribe(listener) {
      listeners.add(listener);
      let cancelled = false;
      const unsubscribers: Array<() => void> = [];
      void ensureSeed(new Date().toISOString()).then(() => {
        if (cancelled) {
          return;
        }
        let pending = 5;
        const arrived = () => {
          pending -= 1;
          if (pending <= 0) {
            ready = true;
            resolveReady();
          }
          emit();
        };
        const pairs = [
          ["categories", (id: string, data: DocumentData) => readCategory(id, data)],
          ["transactions", (id: string, data: DocumentData) => readTransaction(id, data)],
          ["recurring", (id: string, data: DocumentData) => readRecurring(id, data)],
          ["occurrences", (_id: string, data: DocumentData) => readOccurrence(data)],
        ] as const;
        for (const [name, read] of pairs) {
          let first = true;
          unsubscribers.push(
            onSnapshot(collection(db, `${base}/${name}`), (query) => {
              const items = query.docs.flatMap((item) => {
                const value = read(item.id, item.data());
                return value ? [value] : [];
              });
              snapshot = { ...snapshot, [name]: items };
              if (first) {
                first = false;
                arrived();
              } else {
                emit();
              }
            }),
          );
        }
        let firstSettings = true;
        unsubscribers.push(
          onSnapshot(doc(db, `${base}/settings/app`), (item) => {
            const data = item.data();
            const theme =
              data?.theme === "dark" || data?.theme === "system" || data?.theme === "light"
                ? data.theme
                : "light";
            const limits: Record<string, number> = {};
            if (data?.limits && typeof data.limits === "object") {
              for (const [key, value] of Object.entries(data.limits as Record<string, unknown>)) {
                if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
                  limits[key] = value;
                }
              }
            }
            snapshot = { ...snapshot, theme, limits };
            if (firstSettings) {
              firstSettings = false;
              arrived();
            } else {
              emit();
            }
          }),
        );
      });
      return () => {
        cancelled = true;
        listeners.delete(listener);
        for (const unsubscribe of unsubscribers) {
          unsubscribe();
        }
      };
    },
    async catchUp(today, caughtAt) {
      if (!ready) {
        return 0;
      }
      const planned = planRecurring(snapshot, today, caughtAt);
      if (planned.transactions.length === 0) {
        return 0;
      }
      await commitAll(db, [
        ...planned.transactions.map(
          (transaction) => (batch: ReturnType<typeof writeBatch>) =>
            batch.set(doc(db, `${base}/transactions/${transaction.id}`), transaction),
        ),
        ...planned.occurrences.map(
          (occurrence) => (batch: ReturnType<typeof writeBatch>) =>
            batch.set(
              doc(db, `${base}/occurrences/${occurrence.recurringId}_${occurrence.occurrenceDate}`),
              occurrence,
            ),
        ),
      ]);
      return planned.transactions.length;
    },
    async addTransaction(input, createdAt) {
      const id = crypto.randomUUID();
      await setDoc(doc(db, `${base}/transactions/${id}`), {
        ...input,
        note: input.note.trim(),
        recurringId: null,
        occurrenceDate: null,
        createdAt,
        updatedAt: createdAt,
      });
    },
    async updateTransaction(id, input, updatedAt) {
      await setDoc(
        doc(db, `${base}/transactions/${id}`),
        { ...input, note: input.note.trim(), updatedAt },
        { merge: true },
      );
    },
    async deleteTransaction(id) {
      await deleteDoc(doc(db, `${base}/transactions/${id}`));
    },
    async addCategory(input, createdAt) {
      const id = crypto.randomUUID();
      await setDoc(doc(db, `${base}/categories/${id}`), {
        name: input.name.trim(),
        color: input.color,
        emoji: input.emoji.trim(),
        createdAt,
        updatedAt: createdAt,
      });
    },
    async updateCategory(id, input, updatedAt) {
      await setDoc(
        doc(db, `${base}/categories/${id}`),
        {
          name: input.name.trim(),
          color: input.color,
          emoji: input.emoji.trim(),
          updatedAt,
        },
        { merge: true },
      );
    },
    async deleteCategory(id, transferToId, updatedAt): Promise<DeleteCategoryResult> {
      const result = applyDeleteCategory(snapshot, id, transferToId, updatedAt);
      if (!result.ok) {
        return result;
      }
      const writes: Array<(batch: ReturnType<typeof writeBatch>) => void> = [
        (batch) => batch.delete(doc(db, `${base}/categories/${id}`)),
      ];
      for (const transaction of result.snapshot.transactions) {
        if (transaction.updatedAt === updatedAt && transaction.categoryId === transferToId) {
          writes.push((batch) =>
            batch.set(
              doc(db, `${base}/transactions/${transaction.id}`),
              { categoryId: transferToId, updatedAt },
              { merge: true },
            ),
          );
        }
      }
      for (const payment of result.snapshot.recurring) {
        if (payment.updatedAt === updatedAt && payment.categoryId === transferToId) {
          writes.push((batch) =>
            batch.set(
              doc(db, `${base}/recurring/${payment.id}`),
              { categoryId: transferToId, updatedAt },
              { merge: true },
            ),
          );
        }
      }
      await commitAll(db, writes);
      snapshot = result.snapshot;
      await saveSettings();
      emit();
      return { ok: true };
    },
    async addRecurring(input, createdAt) {
      const id = crypto.randomUUID();
      await setDoc(doc(db, `${base}/recurring/${id}`), {
        ...input,
        createdAt,
        updatedAt: createdAt,
      });
    },
    async updateRecurring(id, input, updatedAt) {
      await setDoc(doc(db, `${base}/recurring/${id}`), { ...input, updatedAt }, { merge: true });
    },
    async deleteRecurring(id) {
      await deleteDoc(doc(db, `${base}/recurring/${id}`));
    },
    async setRecurringEnabled(id, enabled, updatedAt) {
      await setDoc(doc(db, `${base}/recurring/${id}`), { enabled, updatedAt }, { merge: true });
    },
    async setLimit(categoryId, amount) {
      const limits = { ...snapshot.limits };
      if (amount === null) {
        delete limits[categoryId];
      } else {
        limits[categoryId] = amount;
      }
      snapshot = { ...snapshot, limits };
      await saveSettings();
      emit();
    },
    async setTheme(theme) {
      snapshot = { ...snapshot, theme };
      await saveSettings();
      emit();
    },
  };
}
