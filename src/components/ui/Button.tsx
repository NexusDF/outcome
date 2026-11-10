import type { ReactNode } from "react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
} from "react-aria-components";
import { cx, focusRing } from "./styles";

type ButtonVariant = "primary" | "secondary" | "contrast" | "danger" | "ghost" | "soft" | "bare";
type ButtonSize = "md" | "icon" | "icon-sm" | "inline" | "auto";

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-on-accent data-hovered:bg-accent-strong data-pressed:bg-accent-strong",
  secondary:
    "border border-line bg-surface text-ink data-hovered:bg-canvas data-pressed:bg-line",
  contrast:
    "bg-surface text-accent data-hovered:bg-canvas data-pressed:bg-canvas",
  danger:
    "bg-danger text-on-danger data-hovered:brightness-95 data-pressed:brightness-90",
  ghost: "bg-transparent text-ink data-hovered:bg-ink/8 data-pressed:bg-ink/15",
  soft: "bg-surface text-accent shadow-card data-hovered:bg-sage data-pressed:bg-line",
  bare: "bg-transparent",
};

const sizeClass: Record<ButtonSize, string> = {
  md: "h-12 gap-2 px-5 text-sm",
  icon: "size-14 px-0",
  "icon-sm": "size-10 px-0",
  inline: "size-7 px-0",
  auto: "",
};

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} & Omit<AriaButtonProps, "className" | "children"> & {
    children?: ReactNode;
  };

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <AriaButton
      {...props}
      className={cx(
        "inline-flex cursor-pointer items-center justify-center rounded-full font-semibold tracking-tight transition data-disabled:cursor-not-allowed data-disabled:opacity-50 data-pending:opacity-70",
        sizeClass[size],
        focusRing,
        variantClass[variant],
        className,
      )}
    >
      {children}
    </AriaButton>
  );
}
