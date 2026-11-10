export type LimitTone = "success" | "warning" | "danger";

export function limitTone(spent: number, limit: number): LimitTone {
  if (spent > limit) {
    return "danger";
  }
  if (spent * 5 >= limit * 4) {
    return "warning";
  }
  return "success";
}

export function overLimitCategories(
  spent: ReadonlyMap<string, number>,
  limits: Readonly<Record<string, number>>,
): string[] {
  return Object.entries(limits)
    .filter(([categoryId, limit]) => (spent.get(categoryId) ?? 0) > limit)
    .map(([categoryId]) => categoryId);
}
