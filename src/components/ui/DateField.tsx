import { parseDate } from "@internationalized/date";
import {
  Button as AriaButton,
  Calendar,
  CalendarCell,
  CalendarGrid,
  DateInput,
  DatePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Label,
  Popover,
} from "react-aria-components";
import { controlClass, cx, errorClass, focusRing, labelClass } from "./styles";

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  errorMessage?: string;
};

export function DateField({ label, value, onChange, errorMessage }: DateFieldProps) {
  return (
    <DatePicker
      granularity="day"
      value={value ? parseDate(value) : null}
      onChange={(date) => onChange(date ? date.toString() : "")}
      isInvalid={errorMessage !== undefined}
      validationBehavior="aria"
      className="flex flex-col gap-1.5"
    >
      <Label className={labelClass}>{label}</Label>
      <Group className={cx(controlClass, focusRing, "flex items-center")}>
        <DateInput className="flex flex-1">
          {(segment) => (
            <DateSegment
              segment={segment}
              className="rounded px-0.5 data-placeholder:text-muted data-focused:bg-[#1B4332] data-focused:text-white"
            />
          )}
        </DateInput>
        <AriaButton aria-label="Открыть календарь" className="text-[#1B4332]">
          ▾
        </AriaButton>
      </Group>
      {errorMessage ? (
        <span role="alert" className={errorClass}>
          {errorMessage}
        </span>
      ) : null}
      <Popover className="z-[80] rounded-2xl border border-line bg-surface p-3 shadow-card">
        <Dialog className="outline-none">
          <Calendar>
            <header className="flex items-center justify-between gap-3">
              <AriaButton slot="previous" aria-label="Предыдущий месяц" className="size-8 rounded-full">
                ‹
              </AriaButton>
              <Heading className="text-sm font-semibold" />
              <AriaButton slot="next" aria-label="Следующий месяц" className="size-8 rounded-full">
                ›
              </AriaButton>
            </header>
            <CalendarGrid className="mt-2 border-separate border-spacing-1">
              {(date) => (
                <CalendarCell
                  date={date}
                  className="flex size-9 cursor-pointer items-center justify-center rounded-full text-sm data-disabled:text-muted data-outside-month:text-muted data-selected:bg-[#1B4332] data-selected:text-white"
                />
              )}
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </DatePicker>
  );
}
