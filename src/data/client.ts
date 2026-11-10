import type {
  CategoryInput,
  LedgerSnapshot,
  RecurringInput,
  ThemePreference,
  TransactionInput,
} from "../domain/types";

export type DeleteCategoryResult =
  | { ok: true }
  | { ok: false; reason: "not-found" | "has-transactions" | "invalid-target" };

export type LedgerClient = {
  whenReady: () => Promise<void>;
  subscribe: (listener: (snapshot: LedgerSnapshot) => void) => () => void;
  catchUp: (today: string, now: string) => Promise<number>;
  addTransaction: (input: TransactionInput, now: string) => Promise<void>;
  updateTransaction: (id: string, input: TransactionInput, now: string) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (input: CategoryInput, now: string) => Promise<void>;
  updateCategory: (id: string, input: CategoryInput, now: string) => Promise<void>;
  deleteCategory: (
    id: string,
    transferToId: string | null,
    now: string,
  ) => Promise<DeleteCategoryResult>;
  addRecurring: (input: RecurringInput, now: string) => Promise<void>;
  updateRecurring: (id: string, input: RecurringInput, now: string) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  setRecurringEnabled: (id: string, enabled: boolean, now: string) => Promise<void>;
  setLimit: (categoryId: string, amount: number | null) => Promise<void>;
  setTheme: (theme: ThemePreference) => Promise<void>;
};
