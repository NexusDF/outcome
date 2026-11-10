import type { ThemePreference } from "../domain/types";

export function applyTheme(theme: ThemePreference): void {
  const root = document.documentElement;
  if (theme === "system") {
    root.classList.remove("light", "dark");
    return;
  }
  root.classList.toggle("light", theme === "light");
  root.classList.toggle("dark", theme === "dark");
}
