import { Switch as AriaSwitch } from "react-aria-components";
import { focusRing } from "./styles";

type SwitchProps = {
  label: string;
  isSelected: boolean;
  onChange: (selected: boolean) => void;
};

export function Switch({ label, isSelected, onChange }: SwitchProps) {
  return (
    <AriaSwitch
      isSelected={isSelected}
      onChange={onChange}
      className={`group flex cursor-pointer items-center justify-between gap-3 text-sm font-medium ${focusRing} rounded-xl`}
    >
      <span>{label}</span>
      <span className="h-6 w-11 rounded-full bg-line-strong p-0.5 transition group-data-selected:bg-accent">
        <span className="block size-5 rounded-full bg-white transition group-data-selected:translate-x-5 group-data-selected:bg-on-accent" />
      </span>
    </AriaSwitch>
  );
}
