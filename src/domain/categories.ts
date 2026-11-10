import type { Category, CategoryInput, LedgerSnapshot } from "./types";

const presets: Array<Omit<Category, "createdAt" | "updatedAt">> = [
  { id: "cat-food", name: "Продукты", emoji: "🛒", color: "#1B4332" },
  { id: "cat-transport", name: "Транспорт", emoji: "🚌", color: "#C4A15A" },
  { id: "cat-home", name: "Жильё", emoji: "🏠", color: "#8C5A3C" },
  { id: "cat-health", name: "Здоровье", emoji: "💊", color: "#9F3B45" },
  { id: "cat-fun", name: "Развлечения", emoji: "🎬", color: "#3E7A56" },
  { id: "cat-subs", name: "Подписки", emoji: "🔄", color: "#111111" },
  { id: "cat-other", name: "Прочее", emoji: "📦", color: "#7E8882" },
];

export const categoryColors = [
  "#1B4332",
  "#3E7A56",
  "#00704A",
  "#C4A15A",
  "#F5C518",
  "#9F3B45",
  "#111111",
  "#7E8882",
];

export function createDefaultCategories(now: string): Category[] {
  return presets.map((category) => ({
    ...category,
    createdAt: now,
    updatedAt: now,
  }));
}

export function categoryIsUsed(snapshot: LedgerSnapshot, categoryId: string): boolean {
  return (
    snapshot.transactions.some((transaction) => transaction.categoryId === categoryId) ||
    snapshot.recurring.some((payment) => payment.categoryId === categoryId)
  );
}

export function applyDeleteCategory(
  snapshot: LedgerSnapshot,
  categoryId: string,
  transferToId: string | null,
  now: string,
):
  | { ok: true; snapshot: LedgerSnapshot }
  | { ok: false; reason: "not-found" | "has-transactions" | "invalid-target" } {
  const category = snapshot.categories.find((item) => item.id === categoryId);
  if (!category) {
    return { ok: false, reason: "not-found" };
  }
  const used = categoryIsUsed(snapshot, categoryId);
  if (used && !transferToId) {
    return { ok: false, reason: "has-transactions" };
  }
  if (
    transferToId &&
    (transferToId === categoryId ||
      !snapshot.categories.some((item) => item.id === transferToId))
  ) {
    return { ok: false, reason: "invalid-target" };
  }

  const limits = { ...snapshot.limits };
  delete limits[categoryId];
  return {
    ok: true,
    snapshot: {
      ...snapshot,
      categories: snapshot.categories.filter((item) => item.id !== categoryId),
      transactions: snapshot.transactions.map((transaction) =>
        transaction.categoryId === categoryId && transferToId
          ? { ...transaction, categoryId: transferToId, updatedAt: now }
          : transaction,
      ),
      recurring: snapshot.recurring.map((payment) =>
        payment.categoryId === categoryId && transferToId
          ? { ...payment, categoryId: transferToId, updatedAt: now }
          : payment,
      ),
      limits,
    },
  };
}

export function validateCategory(input: CategoryInput): string | null {
  const name = input.name.trim();
  if (name.length === 0) {
    return "Введите название";
  }
  if ([...input.emoji.trim()].length === 0) {
    return "Добавьте эмодзи";
  }
  return null;
}
