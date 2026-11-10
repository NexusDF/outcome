import { describe, expect, it } from "vitest";
import { createLocalLedger } from "./localLedger";

function memoryStore(): { getItem(key: string): string | null; setItem(key: string, value: string): void } {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

const input = {
  amount: 15_000,
  type: "expense" as const,
  categoryId: "cat-food",
  date: "2026-11-11",
  note: "хлеб",
};

describe("createLocalLedger", () => {
  it("сохраняет операцию между открытиями", async () => {
    const store = memoryStore();
    const first = createLocalLedger("2026-11-11T00:00:00.000Z", store);
    await first.addTransaction(input, "2026-11-11T00:00:00.000Z");

    const second = createLocalLedger("2026-11-12T00:00:00.000Z", store);
    let notes: string[] = [];
    second.subscribe((snapshot) => {
      notes = snapshot.transactions.map((transaction) => transaction.note);
    });
    expect(notes).toEqual(["хлеб"]);
  });

  it("начинает с категорий по умолчанию, если запись повреждена", () => {
    const store = memoryStore();
    store.setItem("ledger.v1", "{");
    const ledger = createLocalLedger("2026-11-11T00:00:00.000Z", store);
    let names: string[] = [];
    ledger.subscribe((snapshot) => {
      names = snapshot.categories.map((category) => category.name);
    });
    expect(names).toContain("Продукты");
  });
});
