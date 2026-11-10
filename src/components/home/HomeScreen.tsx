import { Button } from "../ui/Button";
import { BalanceCard } from "./BalanceCard";
import { SearchIcon } from "./icons";
import { QuickActions, type ActionId } from "./QuickActions";
import { TransactionList, type TransactionRow } from "./TransactionList";

type HomeScreenProps = {
  greeting: string;
  monthLabel: string;
  hidden: boolean;
  amount: string;
  changeLabel: string | null;
  positive: boolean;
  rows: TransactionRow[];
  income: string;
  expense: string;
  top: Array<{ id: string; emoji: string; name: string; amount: string }>;
  limits: Array<{
    id: string;
    name: string;
    emoji: string;
    spent: string;
    width: number;
    tone: "success" | "warning" | "danger";
  }>;
  warning: string | null;
  onToggleHidden: () => void;
  onAction: (id: ActionId) => void;
  onOpen: (id: string) => void;
  onSeeAll: () => void;
  onSearch: () => void;
  notice?: string | null;
};

export function HomeScreen({
  greeting,
  monthLabel,
  hidden,
  amount,
  changeLabel,
  positive,
  rows,
  income,
  expense,
  top,
  limits,
  warning,
  onToggleHidden,
  onAction,
  onOpen,
  onSeeAll,
  onSearch,
  notice,
}: HomeScreenProps) {
  return (
    <main className="px-5 pt-6 pb-28">
      <header className="flex h-11 items-center justify-between gap-3">
        <h1 className="text-[20px] leading-none font-bold tracking-tight text-ink">{greeting}</h1>
        <Button
          variant="soft"
          size="auto"
          aria-label="Поиск операций"
          onPress={onSearch}
          className="size-11 shrink-0"
        >
          <SearchIcon className="size-[18px]" />
        </Button>
      </header>
      {notice ? (
        <p className="mt-4 rounded-2xl bg-[#F8F1DE] px-4 py-3 text-sm leading-5 text-[#6B5420]">{notice}</p>
      ) : null}
      {warning ? (
        <p className="mt-4 rounded-2xl bg-[#F8E8EA] px-4 py-3 text-sm text-[#9F3B45]">{warning}</p>
      ) : null}
      <BalanceCard
        hidden={hidden}
        amount={amount}
        monthLabel={monthLabel}
        changeLabel={changeLabel}
        positive={positive}
        onToggleHidden={onToggleHidden}
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Summary label="Доходы" value={hidden ? "•••••• ₽" : income} />
        <Summary label="Расходы" value={hidden ? "•••••• ₽" : expense} />
      </div>
      <QuickActions onAction={onAction} />
      {limits.length > 0 ? (
        <section className="mt-5 rounded-[22px] bg-surface p-4 shadow-card">
          <h2 className="text-[15px] font-bold">Лимиты</h2>
          <ul className="mt-2">
            {limits.map((item) => (
              <li key={item.id} className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-x-2 border-b border-line py-2.5 last:border-b-0">
                <span aria-hidden="true">{item.emoji}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{item.name}</span>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-line">
                    <span
                      className={`block h-full rounded-full ${
                        item.tone === "danger" ? "bg-danger" : item.tone === "warning" ? "bg-warning" : "bg-success"
                      }`}
                      style={{ width: `${item.width}%` }}
                    />
                  </span>
                </span>
                <span className={`text-xs tabular-nums ${item.tone === "danger" ? "font-semibold text-danger" : "text-muted"}`}>
                  {hidden ? "••••" : item.spent}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {top.length > 0 ? (
        <div className="mt-5 grid grid-cols-3 gap-2">
          {top.map((item) => (
            <div key={item.id} className="rounded-2xl bg-surface px-2 py-3 text-center shadow-card">
              <div className="text-lg">{item.emoji}</div>
              <p className="truncate text-xs font-semibold">{item.name}</p>
              <p className="text-[11px] text-muted tabular-nums">{item.amount}</p>
            </div>
          ))}
        </div>
      ) : null}
      <TransactionList rows={rows} onOpen={onOpen} onSeeAll={onSeeAll} />
    </main>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface px-3 py-3 shadow-card">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-1 text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}
