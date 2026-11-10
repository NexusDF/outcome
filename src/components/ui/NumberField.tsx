import {
  Group,
  Input,
  Label,
  NumberField as AriaNumberField,
  Text,
  type NumberFieldProps as AriaNumberFieldProps,
} from "react-aria-components";
import { controlClass, cx, descriptionClass, errorClass, focusRing, labelClass } from "./styles";

export type NumberFieldProps = {
  label: string;
  description?: string;
  errorMessage?: string;
  className?: string;
} & Omit<AriaNumberFieldProps, "className" | "children">;

export function NumberField({
  label,
  description,
  errorMessage,
  className,
  isInvalid,
  ...props
}: NumberFieldProps) {
  return (
    <AriaNumberField
      {...props}
      formatOptions={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
      minValue={props.minValue ?? 0}
      isInvalid={isInvalid ?? errorMessage !== undefined}
      validationBehavior="aria"
      className={cx("flex flex-col gap-1.5", className)}
    >
      <Label className={labelClass}>{label}</Label>
      <Group className={cx(controlClass, focusRing, "flex items-center")}>
        <Input className="w-full bg-transparent outline-none" />
      </Group>
      {description ? <Text slot="description" className={descriptionClass}>{description}</Text> : null}
      {errorMessage ? <span className={errorClass}>{errorMessage}</span> : null}
    </AriaNumberField>
  );
}
