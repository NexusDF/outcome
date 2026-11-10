import { describe, expect, it } from "vitest";
import { limitTone, overLimitCategories } from "./limits";

describe("limitTone", () => {
  it("зелёный до 80%, жёлтый с 80% и красный после превышения", () => {
    expect(limitTone(79, 100)).toBe("success");
    expect(limitTone(80, 100)).toBe("warning");
    expect(limitTone(100, 100)).toBe("warning");
    expect(limitTone(101, 100)).toBe("danger");
  });
});

describe("overLimitCategories", () => {
  it("возвращает категории, где расход больше лимита", () => {
    expect(
      overLimitCategories(new Map([["cat-food", 120]]), {
        "cat-food": 100,
        "cat-home": 500,
      }),
    ).toEqual(["cat-food"]);
  });
});
