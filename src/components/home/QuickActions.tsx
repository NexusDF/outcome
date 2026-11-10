import type { ReactNode } from "react";
import { Button } from "../ui/Button";
import { ConvertIcon, MinusIcon, PlusIcon } from "./icons";

export type ActionId = "income" | "expense" | "recurring";

const actions: Array<{ id: ActionId; label: string; icon: ReactNode }> = [
  { id: "income", label: "Доход", icon: <PlusIcon className="size-6" /> },
  { id: "expense", label: "Расход", icon: <MinusIcon className="size-6" /> },
  { id: "recurring", label: "Повторы", icon: <ConvertIcon className="size-6" /> },
];

type QuickActionsProps = {
  onAction: (id: ActionId) => void;
};

export function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <div className="mt-6 grid grid-cols-3 gap-2">
      {actions.map((action) => (
        <div key={action.id} className="flex flex-col items-center gap-2">
          <Button variant="soft" size="icon" aria-label={action.label} onPress={() => onAction(action.id)}>
            {action.icon}
          </Button>
          <span aria-hidden="true" className="text-xs font-medium text-muted">
            {action.label}
          </span>
        </div>
      ))}
    </div>
  );
}
