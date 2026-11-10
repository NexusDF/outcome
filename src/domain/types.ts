export type TransactionType = "expense" | "income";

export type Category = {
  id: string;
  name: string;
  color: string;
  emoji: string;
  createdAt: string;
  updatedAt: string;
};

export type Transaction = {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  note: string;
  recurringId: string | null;
  occurrenceDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type RecurringPayment = {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PostedOccurrence = {
  recurringId: string;
  occurrenceDate: string;
};

export type ThemePreference = "system" | "light" | "dark";

export type SortField = "date" | "amount" | "category";
export type SortDirection = "asc" | "desc";

export type TransactionFilters = {
  from: string | null;
  to: string | null;
  categoryId: string | null;
  type: TransactionType | null;
  query: string;
  sortField: SortField;
  sortDirection: SortDirection;
};

export type TransactionInput = {
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  note: string;
};

export type CategoryInput = {
  name: string;
  color: string;
  emoji: string;
};

export type RecurringInput = {
  amount: number;
  type: TransactionType;
  categoryId: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate: string | null;
  enabled: boolean;
};

export type LedgerSnapshot = {
  categories: Category[];
  transactions: Transaction[];
  recurring: RecurringPayment[];
  occurrences: PostedOccurrence[];
  limits: Record<string, number>;
  theme: ThemePreference;
};

export const emptyFilters: TransactionFilters = {
  from: null,
  to: null,
  categoryId: null,
  type: null,
  query: "",
  sortField: "date",
  sortDirection: "desc",
};
