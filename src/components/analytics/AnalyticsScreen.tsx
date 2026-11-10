import { useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { categorySlices, monthlySeries } from "../../domain/charts";
import { currentMonth, formatMonth, formatMonthShort, shiftMonth } from "../../domain/dates";
import { limitTone } from "../../domain/limits";
import { formatMoney } from "../../domain/money";
import { monthBalance, spentByCategory } from "../../domain/transactions";
import type { Category, Transaction } from "../../domain/types";
import { Button } from "../ui/Button";
import { ProgressBar } from "../ui/ProgressBar";

type AnalyticsScreenProps = {
  transactions: Transaction[];
  categories: Category[];
  limits: Record<string, number>;
};

export function AnalyticsScreen({ transactions, categories, limits }: AnalyticsScreenProps) {
  const newest = currentMonth();
  const [month, setMonth] = useState(newest);
  const series = monthlySeries(transactions, newest).map((point) => ({
    ...point,
    label: formatMonthShort(point.month),
  }));
  const slices = categorySlices(transactions, categories, month);
  const spent = spentByCategory(transactions, month);
  const income = transactions
    .filter((item) => item.type === "income" && item.date.startsWith(month))
    .reduce((sum, item) => sum + item.amount, 0);
  const expense = [...spent.values()].reduce((sum, value) => sum + value, 0);

  return (
    <main className="px-5 pt-6 pb-28">
      <h1 className="text-[22px] font-extrabold tracking-tight">Аналитика</h1>
      <div className="mt-4 flex items-center justify-between">
        <Button
          variant="soft"
          size="inline"
          aria-label="Предыдущий месяц"
          onPress={() => setMonth((value) => shiftMonth(value, -1))}
        >
          ‹
        </Button>
        <p className="text-sm font-semibold capitalize">{formatMonth(month)}</p>
        <Button
          variant="soft"
          size="inline"
          aria-label="Следующий месяц"
          isDisabled={month >= newest}
          onPress={() => setMonth((value) => (value >= newest ? value : shiftMonth(value, 1)))}
        >
          ›
        </Button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Summary label="Доходы" value={formatMoney(income)} />
        <Summary label="Расходы" value={formatMoney(expense)} />
        <Summary label="Баланс" value={formatMoney(monthBalance(transactions, month))} />
      </div>
      <ChartCard title="По категориям">
        {slices.length === 0 ? (
          <p className="text-sm text-muted">Нет расходов за этот месяц.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slices} dataKey="amount" nameKey="name" innerRadius={48} outerRadius={72}>
                  {slices.map((slice) => (
                    <Cell key={slice.id} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>
      <ChartCard title="Расходы за 12 месяцев">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}>
              <CartesianGrid vertical={false} stroke="#E6E1D6" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis hide />
              <Tooltip formatter={(value) => formatMoney(Number(value))} />
              <Legend />
              <Bar dataKey="expense" name="Расходы" fill="#1B4332" radius={6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
      <ChartCard title="Доходы и расходы">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid vertical={false} stroke="#E6E1D6" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis hide />
              <Tooltip formatter={(value) => formatMoney(Number(value))} />
              <Legend />
              <Line dataKey="income" name="Доходы" stroke="#3E7A56" strokeWidth={2} dot={false} />
              <Line dataKey="expense" name="Расходы" stroke="#9F3B45" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
      {Object.keys(limits).length > 0 ? (
        <section className="mt-4 flex flex-col gap-4 rounded-[28px] bg-surface p-4 shadow-card">
          <h2 className="font-bold">Лимиты</h2>
          {categories.flatMap((category) => {
            const limit = limits[category.id];
            if (limit === undefined) {
              return [];
            }
            const value = spent.get(category.id) ?? 0;
            return [
              <ProgressBar
                key={category.id}
                label={category.name}
                value={Math.min(100, Math.round((value / limit) * 100))}
                tone={limitTone(value, limit)}
              />,
            ];
          })}
        </section>
      ) : null}
    </main>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface px-2 py-3 shadow-card">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-1 text-xs font-bold">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4 rounded-[28px] bg-surface p-4 shadow-card">
      <h2 className="mb-3 font-bold">{title}</h2>
      {children}
    </section>
  );
}
