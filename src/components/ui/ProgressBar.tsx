import {
  Label,
  ProgressBar as AriaProgressBar,
  type ProgressBarProps as AriaProgressBarProps,
} from "react-aria-components";
import { cx, labelClass } from "./styles";

type ProgressTone = "accent" | "success" | "warning" | "danger";

const toneClass: Record<ProgressTone, string> = {
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export type ProgressBarProps = {
  label: string;
  tone?: ProgressTone;
  className?: string;
} & Omit<AriaProgressBarProps, "className" | "children" | "label">;

export function ProgressBar({
  label,
  tone = "accent",
  className,
  ...props
}: ProgressBarProps) {
  return (
    <AriaProgressBar
      {...props}
      className={cx("flex flex-col gap-2", className)}
    >
      {({ percentage, valueText, isIndeterminate }) => (
        <>
          <div className="flex items-center justify-between gap-3">
            <Label className={labelClass}>{label}</Label>
            {valueText ? (
              <span className="text-sm text-muted">{valueText}</span>
            ) : null}
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-line">
            <div
              className={cx(
                "h-full rounded-full",
                toneClass[tone],
                isIndeterminate && "w-1/3 animate-pulse",
              )}
              style={
                isIndeterminate
                  ? undefined
                  : { width: `${percentage ?? 0}%` }
              }
            />
          </div>
        </>
      )}
    </AriaProgressBar>
  );
}
