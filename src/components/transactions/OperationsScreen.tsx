import { useState } from "react";
import { buildCsv, transactionsToCsvRows } from "../../domain/csv";
import { formatDay } from "../../domain/dates";
import { formatSignedMoney } from "../../domain/money";
import { filterTransactions } from "../../domain/transactions";
import {
  emptyFilters,
  type Category,
  type Transaction,
  type TransactionFilters,
} from "../../domain/types";
import { downloadText } from "../../lib/download";
import { Button } from "../ui/Button";
import { DateField } from "../ui/DateField";
import { Select } from "../ui/Select";
import { TextField } from "../ui/TextField";

type OperationsScreenProps = {
  transactions: Transaction[];
  categories: Category[];
  filters: TransactionFilters;
  focusSearch: boolean;
  onSearchFocused: () => void;
  onCreate: () => void;
  onFilters: (patch: Partial<TransactionFilters>) => void;
  onOpen: (id: string) => void;
};

function panelFiltersActive(filters: TransactionFilters): boolean {
  return (
    filters.from !== null ||
    filters.to !== null ||
    filters.categoryId !== null ||
    filters.type !== null ||
    filters.sortField !== "date" ||
    filters.sortDirection !== "desc"
  );
}

export function OperationsScreen({
  transactions,
  categories,
  filters,
  focusSearch,
  onSearchFocused,
  onCreate,
  onFilters,
  onOpen,
}: OperationsScreenProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const visible = filterTransactions(transactions, categories, filters);
  const names = new Map(categories.map((category) => [category.id, category]));
  const narrowed = panelFiltersActive(filters);

  function exportCsv(): void {
    downloadText(
      "operacii.csv",
      buildCsv(transactionsToCsvRows(visible, categories)),
      "text/csv;charset=utf-8",
    );
  }

  function resetPanel(): void {
    onFilters({
      from: null,
      to: null,
      categoryId: null,
      type: null,
      sortField: "date",
      sortDirection: "desc",
    });
  }

  return (
    <main className="px-5 pt-6 pb-28">
      <h1 className="text-[22px] font-extrabold tracking-tight">Операции</h1>
      <div className="mt-4 flex flex-col gap-3">
        <TextField
          label="Поиск по заметке"
          value={filters.query}
          autoFocus={focusSearch}
          onFocus={onSearchFocused}
          onChange={(query) => onFilters({ query })}
          placeholder="Обед"
        />
        <Button
          variant="secondary"
          aria-expanded={filtersOpen}
          aria-controls="operation-filters"
          aria-label={narrowed ? "Фильтры, условия выбраны" : undefined}
          onPress={() => setFiltersOpen((open) => !open)}
        >
          Фильтры
          {narrowed ? <span aria-hidden="true" className="ml-2 size-2 rounded-full bg-accent" /> : null}
        </Button>
        {filtersOpen ? (
          <div id="operation-filters" className="flex flex-col gap-3 rounded-[28px] bg-surface p-4 shadow-card">
            <Select
              label="Категория"
              selectedKey={filters.categoryId ?? "all"}
              onSelectionChange={(key) =>
                onFilters({ categoryId: key === "all" || key === null ? null : String(key) })
              }
              options={[
                { id: "all", label: "Все категории" },
                ...categories.map((category) => ({ id: category.id, label: category.name })),
              ]}
            />
            <Select
              label="Тип"
              selectedKey={filters.type ?? "all"}
              onSelectionChange={(key) =>
                onFilters({
                  type: key === "expense" || key === "income" ? key : null,
                })
              }
              options={[
                { id: "all", label: "Все" },
                { id: "expense", label: "Расходы" },
                { id: "income", label: "Доходы" },
              ]}
            />
            <DateField
              label="С даты"
              value={filters.from ?? ""}
              onChange={(from) => onFilters({ from: from || null })}
            />
            <DateField
              label="По дату"
              value={filters.to ?? ""}
              onChange={(to) => onFilters({ to: to || null })}
            />
            <Select
              label="Сортировка"
              selectedKey={`${filters.sortField}-${filters.sortDirection}`}
              onSelectionChange={(key) => {
                const [sortField, sortDirection] = String(key).split("-");
                if (
                  (sortField === "date" || sortField === "amount" || sortField === "category") &&
                  (sortDirection === "asc" || sortDirection === "desc")
                ) {
                  onFilters({ sortField, sortDirection });
                }
              }}
              options={[
                { id: "date-desc", label: "Сначала новые" },
                { id: "date-asc", label: "Сначала старые" },
                { id: "amount-desc", label: "Сумма по убыванию" },
                { id: "amount-asc", label: "Сумма по возрастанию" },
                { id: "category-asc", label: "Категория А–Я" },
              ]}
            />
            <Button variant="secondary" isDisabled={!narrowed} onPress={resetPanel}>
              Сбросить
            </Button>
            <p id="export-hint" className="text-sm text-muted">
              Скачать отфильтрованное, CSV
            </p>
            <Button variant="secondary" aria-describedby="export-hint" onPress={exportCsv}>
              Экспорт CSV
            </Button>
          </div>
        ) : null}
      </div>
      {visible.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          {transactions.length === 0 ? (
            <>
              <p className="text-sm text-muted">Пока нет операций.</p>
              <Button onPress={onCreate}>Добавить расход</Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">Нет операций с этими условиями.</p>
              <Button variant="secondary" onPress={() => onFilters(emptyFilters)}>
                Сбросить фильтры
              </Button>
            </>
          )}
        </div>
      ) : (
        <ul className="mt-4">
          {visible.map((transaction) => {
            const category = names.get(transaction.categoryId);
            const title = transaction.note || category?.name || "Без категории";
            return (
              <li key={transaction.id} className="border-b border-line last:border-b-0">
                <Button
                  variant="bare"
                  size="auto"
                  onPress={() => onOpen(transaction.id)}
                  className="h-auto w-full justify-start gap-3 px-0 py-3 text-left font-normal"
                >
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-lg"
                    style={{ backgroundColor: category?.color ?? "#7E8882" }}
                  >
                    {category?.emoji ?? "📦"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-ink">{title}</span>
                    <span className="mt-0.5 block text-xs text-muted">{formatDay(transaction.date)}</span>
                  </span>
                  <span
                    className={
                      transaction.type === "income"
                        ? "text-[15px] font-semibold text-positive tabular-nums"
                        : "text-[15px] font-semibold text-ink tabular-nums"
                    }
                  >
                    {formatSignedMoney(transaction.amount, transaction.type === "income")}
                  </span>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
