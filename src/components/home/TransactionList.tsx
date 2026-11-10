import { Button } from "../ui/Button";

export type TransactionRow = {
  id: string;
  title: string;
  detail: string;
  amount: string;
  date: string;
  income: boolean;
  emoji: string;
  color: string;
};

type TransactionListProps = {
  rows: TransactionRow[];
  onOpen: (id: string) => void;
  onSeeAll: () => void;
};

export function TransactionList({ rows, onOpen, onSeeAll }: TransactionListProps) {
  return (
    <section className="mt-7">
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-bold tracking-tight text-ink">Последние операции</h2>
        <Button
          variant="bare"
          size="auto"
          onPress={onSeeAll}
          className="h-11 shrink-0 px-2 text-[13px] font-semibold whitespace-nowrap text-accent data-hovered:bg-transparent data-pressed:text-ink"
        >
          Все операции
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Пока нет операций. Добавьте расход или доход.</p>
      ) : (
        <ul className="mt-2">
          {rows.map((row) => (
            <li key={row.id} className="border-b border-line last:border-b-0">
              <Button
                variant="bare"
                size="auto"
                onPress={() => onOpen(row.id)}
                className="h-auto w-full justify-start gap-3 rounded-none px-0 py-3.5 text-left font-normal"
              >
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-full text-lg"
                  style={{ backgroundColor: row.color }}
                >
                  {row.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-ink">{row.title}</span>
                  <span className="mt-0.5 block text-xs text-muted">{row.detail}</span>
                </span>
                <span className="text-right">
                  <span
                    className={
                      row.income
                        ? "block text-[15px] font-semibold text-positive tabular-nums"
                        : "block text-[15px] font-semibold text-ink tabular-nums"
                    }
                  >
                    {row.amount}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">{row.date}</span>
                </span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
