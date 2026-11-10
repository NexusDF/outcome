import { Button } from "../ui/Button";
import { EyeIcon, EyeOffIcon } from "./icons";

type BalanceCardProps = {
  hidden: boolean;
  amount: string;
  monthLabel: string;
  changeLabel: string | null;
  positive: boolean;
  onToggleHidden: () => void;
};

export function BalanceCard({
  hidden,
  amount,
  monthLabel,
  changeLabel,
  positive,
  onToggleHidden,
}: BalanceCardProps) {
  return (
    <section className="mt-6 rounded-[22px] bg-[#1B4332] px-5 py-5 text-[#F7F4EE] shadow-[0_10px_24px_rgb(27_67_50/0.16)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-medium text-white/90">Баланс · {monthLabel}</h2>
        <Button
          variant="bare"
          size="auto"
          aria-label={hidden ? "Показать баланс" : "Скрыть баланс"}
          aria-pressed={hidden}
          onPress={onToggleHidden}
          className="size-11 shrink-0 text-white data-hovered:bg-white/10 data-pressed:bg-white/15"
        >
          {hidden ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
        </Button>
      </div>
      <p className="mt-3 text-[32px] leading-none font-extrabold tracking-[-0.03em] tabular-nums">
        {hidden ? <span className="sr-only">Баланс скрыт</span> : null}
        {hidden ? <span aria-hidden="true">•••••• ₽</span> : amount}
      </p>
      {changeLabel ? (
        <p
          className={
            positive
              ? "mt-3 text-[13px] font-semibold text-[#D7E8D4] tabular-nums"
              : "mt-3 text-[13px] font-semibold text-[#F3C7CB] tabular-nums"
          }
        >
          {changeLabel} к прошлому месяцу
        </p>
      ) : (
        <p className="mt-3 text-[13px] text-white/75">Сравнение появится со следующего месяца</p>
      )}
    </section>
  );
}
