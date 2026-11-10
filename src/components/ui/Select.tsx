import {
  Button,
  FieldError,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue,
  Text,
  type SelectProps as AriaSelectProps,
} from "react-aria-components";
import {
  controlClass,
  cx,
  descriptionClass,
  errorClass,
  focusRing,
  labelClass,
} from "./styles";

export type SelectOption = {
  id: string;
  label: string;
};

export type SelectProps = {
  label: string;
  options: readonly SelectOption[];
  description?: string;
  errorMessage?: string;
  className?: string;
} & Omit<AriaSelectProps<SelectOption>, "className" | "children">;

export function Select({
  label,
  options,
  description,
  errorMessage,
  className,
  isInvalid,
  ...props
}: SelectProps) {
  return (
    <AriaSelect
      {...props}
      isInvalid={isInvalid ?? errorMessage !== undefined}
      className={cx("flex flex-col gap-1.5", className)}
      validationBehavior="aria"
    >
      <Label className={labelClass}>{label}</Label>
      <Button
        className={cx(
          controlClass,
          focusRing,
          "flex cursor-pointer items-center justify-between gap-2 text-left",
        )}
      >
        <SelectValue className="truncate data-placeholder:text-muted" />
        <span aria-hidden="true" className="text-muted">
          ▾
        </span>
      </Button>
      {description ? (
        <Text slot="description" className={descriptionClass}>
          {description}
        </Text>
      ) : null}
      {errorMessage ? (
        <FieldError className={errorClass}>{errorMessage}</FieldError>
      ) : null}
      <Popover className="z-50 w-(--trigger-width) overflow-hidden rounded-2xl border border-line bg-surface shadow-card outline-none">
        <ListBox className="max-h-60 overflow-auto p-1.5 outline-none">
          {options.map((option) => (
            <ListBoxItem
              key={option.id}
              id={option.id}
              textValue={option.label}
              className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-ink outline-none data-disabled:opacity-50 data-focused:bg-sage data-selected:font-semibold"
            >
              {option.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}
