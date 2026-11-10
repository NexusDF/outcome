import {
  FieldError,
  Input,
  Label,
  Text,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from "react-aria-components";
import {
  controlClass,
  cx,
  descriptionClass,
  errorClass,
  focusRing,
  labelClass,
} from "./styles";

export type TextFieldProps = {
  label: string;
  description?: string;
  errorMessage?: string;
  placeholder?: string;
  className?: string;
} & Omit<AriaTextFieldProps, "className" | "children">;

export function TextField({
  label,
  description,
  errorMessage,
  placeholder,
  className,
  isInvalid,
  ...props
}: TextFieldProps) {
  return (
    <AriaTextField
      {...props}
      isInvalid={isInvalid ?? errorMessage !== undefined}
      className={cx("flex flex-col gap-1.5", className)}
      validationBehavior="aria"
    >
      <Label className={labelClass}>{label}</Label>
      <Input
        placeholder={placeholder}
        className={cx(controlClass, focusRing, "placeholder:text-muted")}
      />
      {description ? (
        <Text slot="description" className={descriptionClass}>
          {description}
        </Text>
      ) : null}
      {errorMessage ? (
        <FieldError className={errorClass}>{errorMessage}</FieldError>
      ) : null}
    </AriaTextField>
  );
}
