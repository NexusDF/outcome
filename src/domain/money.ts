const moneyFormat = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
});

export function rublesToKopecks(rubles: number): number {
  return Math.round((rubles + Number.EPSILON) * 100);
}

export function parseRublesToKopecks(text: string): number | null {
  const normalized = text.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  return rublesToKopecks(Number(normalized));
}

export function kopecksToInput(kopecks: number): string {
  const rubles = Math.floor(Math.abs(kopecks) / 100);
  const cents = String(Math.abs(kopecks) % 100).padStart(2, "0");
  return `${kopecks < 0 ? "-" : ""}${rubles},${cents}`;
}

export function formatMoney(kopecks: number): string {
  return moneyFormat.format(kopecks / 100);
}

export function formatSignedMoney(kopecks: number, income: boolean): string {
  const formatted = formatMoney(Math.abs(kopecks));
  return income ? `+ ${formatted}` : `− ${formatted}`;
}

export function formatKopecksForCsv(kopecks: number): string {
  const sign = kopecks < 0 ? "-" : "";
  const absolute = Math.abs(kopecks);
  const rubles = Math.floor(absolute / 100);
  const cents = String(absolute % 100).padStart(2, "0");
  return `${sign}${rubles},${cents}`;
}

export function formatPercent(value: number): string {
  const formatted = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 1,
    signDisplay: "exceptZero",
  }).format(value);
  return `${formatted} %`;
}
