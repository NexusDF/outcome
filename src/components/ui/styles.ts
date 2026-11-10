export function cx(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(" ");
}

export const focusRing =
  "outline-none data-focus-visible:ring-2 data-focus-visible:ring-accent data-focus-visible:ring-offset-2 data-focus-visible:ring-offset-canvas";

export const labelClass = "text-sm font-semibold text-ink";

export const descriptionClass = "text-sm text-muted";

export const errorClass = "text-sm text-danger";

export const controlClass =
  "h-12 w-full rounded-2xl border border-line-strong bg-surface px-4 text-sm text-ink data-disabled:opacity-50 data-invalid:border-danger";
