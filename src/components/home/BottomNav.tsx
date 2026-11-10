import type { ReactNode } from "react";
import { Button } from "../ui/Button";
import { cx } from "../ui/styles";
import { CardIcon, ChartIcon, HomeIcon, PersonIcon, PlusIcon } from "./icons";

export type AppScreen = "home" | "analytics" | "operations" | "profile";

const items: Array<{ id: AppScreen; label: string; icon: ReactNode }> = [
  { id: "home", label: "Главная", icon: <HomeIcon className="size-6" /> },
  { id: "analytics", label: "Аналитика", icon: <ChartIcon className="size-6" /> },
  { id: "operations", label: "Операции", icon: <CardIcon className="size-6" /> },
  { id: "profile", label: "Профиль", icon: <PersonIcon className="size-6" /> },
];

type BottomNavProps = {
  screen: AppScreen;
  onScreen: (screen: AppScreen) => void;
  onCreate: () => void;
};

export function BottomNav({ screen, onScreen, onCreate }: BottomNavProps) {
  const leading = items.slice(0, 2);
  const trailing = items.slice(2);

  return (
    <nav
      aria-label="Разделы"
      className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[390px] -translate-x-1/2 items-end justify-between bg-canvas px-2 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]"
    >
      {leading.map((item) => (
        <NavButton key={item.id} item={item} selected={screen === item.id} onPress={() => onScreen(item.id)} />
      ))}
      <Button
        aria-label="Новый расход"
        size="icon"
        onPress={onCreate}
        className="mb-3 bg-[#1B4332] text-white shadow-[0_8px_16px_rgb(27_67_50/0.28)] data-hovered:bg-[#16382A] data-pressed:bg-[#122E23]"
      >
        <PlusIcon className="size-6" />
      </Button>
      {trailing.map((item) => (
        <NavButton key={item.id} item={item} selected={screen === item.id} onPress={() => onScreen(item.id)} />
      ))}
    </nav>
  );
}

function NavButton({
  item,
  selected,
  onPress,
}: {
  item: (typeof items)[number];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      variant="bare"
      size="auto"
      aria-current={selected ? "page" : undefined}
      onPress={onPress}
      className={cx(
        "h-auto min-h-11 w-16 flex-col gap-1 px-0 py-1 text-xs font-medium data-hovered:bg-transparent",
        selected ? "text-ink" : "text-muted",
      )}
    >
      {item.icon}
      {item.label}
    </Button>
  );
}
