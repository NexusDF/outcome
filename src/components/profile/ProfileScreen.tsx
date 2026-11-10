import { useEffect, useState } from "react";
import {
  applyDeleteCategory,
  categoryColors,
  categoryIsUsed,
  validateCategory,
} from "../../domain/categories";
import { todayIso } from "../../domain/dates";
import { limitTone } from "../../domain/limits";
import { formatMoney, kopecksToInput, parseRublesToKopecks } from "../../domain/money";
import { spentByCategory } from "../../domain/transactions";
import type {
  Category,
  CategoryInput,
  LedgerSnapshot,
  RecurringInput,
  RecurringPayment,
  ThemePreference,
} from "../../domain/types";
import type { LedgerClient } from "../../data/client";
import { readableError } from "../../lib/errors";
import { MoonIcon, SunIcon, SystemThemeIcon } from "../home/icons";
import { Button } from "../ui/Button";
import { DateField } from "../ui/DateField";
import { Modal } from "../ui/Modal";
import { Select } from "../ui/Select";
import { Switch } from "../ui/Switch";
import { TextField } from "../ui/TextField";

const themes: Array<{ id: ThemePreference; label: string; icon: typeof SunIcon }> = [
  { id: "system", label: "Как в системе", icon: SystemThemeIcon },
  { id: "light", label: "Светлая", icon: SunIcon },
  { id: "dark", label: "Тёмная", icon: MoonIcon },
];

const frequencies = [
  { id: "daily", label: "Ежедневно" },
  { id: "weekly", label: "Еженедельно" },
  { id: "monthly", label: "Ежемесячно" },
  { id: "yearly", label: "Ежегодно" },
];

type ProfileScreenProps = {
  snapshot: LedgerSnapshot;
  client: LedgerClient;
  scrollTo?: "recurring" | null;
  onScrolled?: () => void;
  onError: (message: string | null) => void;
};

export function ProfileScreen({
  snapshot,
  client,
  scrollTo = null,
  onScrolled,
  onError,
}: ProfileScreenProps) {
  const now = () => new Date().toISOString();
  const [categoryDraft, setCategoryDraft] = useState<Category | null | "new">(null);
  const [armedDelete, setArmedDelete] = useState<string | null>(null);
  const [recurringDraft, setRecurringDraft] = useState<RecurringPayment | null | "new">(null);
  const [transfer, setTransfer] = useState<{ id: string; target: string } | null>(null);
  const [limitCategoryId, setLimitCategoryId] = useState<string | null>(null);
  const month = todayIso().slice(0, 7);
  const spent = spentByCategory(snapshot.transactions, month);

  useEffect(() => {
    if (scrollTo !== "recurring") {
      return;
    }
    const frame = requestAnimationFrame(() => {
      const title = document.getElementById("recurring-title");
      title?.scrollIntoView({ behavior: "smooth", block: "start" });
      title?.focus({ preventScroll: true });
      onScrolled?.();
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollTo, onScrolled]);

  async function run(action: () => Promise<void>): Promise<void> {
    try {
      await action();
      onError(null);
    } catch (caught) {
      onError(readableError(caught));
    }
  }

  async function saveCategory(input: CategoryInput, current: Category | null): Promise<void> {
    const message = validateCategory(input);
    if (message) {
      onError(message);
      return;
    }
    await run(async () => {
      if (current) {
        await client.updateCategory(current.id, input, now());
      } else {
        await client.addCategory(input, now());
      }
      setCategoryDraft(null);
    });
  }

  async function removeCategory(category: Category): Promise<void> {
    if (categoryIsUsed(snapshot, category.id)) {
      const target = snapshot.categories.find((item) => item.id !== category.id);
      if (!target) {
        onError("Нельзя удалить единственную категорию");
        return;
      }
      setTransfer({ id: category.id, target: target.id });
      return;
    }
    try {
      const result = await client.deleteCategory(category.id, null, now());
      if (!result.ok) {
        onError("Не удалось удалить категорию");
        return;
      }
      onError(null);
    } catch (caught) {
      onError(readableError(caught));
    }
  }

  return (
    <main className="px-5 pt-6 pb-28">
      <h1 className="text-[22px] font-extrabold tracking-tight">Профиль</h1>
      <section className="mt-4 rounded-[28px] bg-surface p-4 shadow-card">
        <h2 className="font-bold">Тема</h2>
        <div className="mt-3 flex justify-around">
          {themes.map((theme) => {
            const selected = snapshot.theme === theme.id;
            const Icon = theme.icon;
            return (
              <Button
                key={theme.id}
                aria-label={theme.label}
                aria-pressed={selected}
                variant={selected ? "primary" : "secondary"}
                size="icon"
                onPress={() => void run(() => client.setTheme(theme.id))}
              >
                <Icon className="size-6" />
              </Button>
            );
          })}
        </div>
      </section>

      <section className="mt-4 rounded-[28px] bg-surface p-4 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Категории</h2>
          <Button variant="secondary" onPress={() => setCategoryDraft("new")}>
            Добавить
          </Button>
        </div>
        <ul className="mt-3">
          {snapshot.categories.map((category) => (
            <li
              key={category.id}
              className="grid grid-cols-[2.5rem_minmax(0,1fr)_4.75rem_4.25rem] items-center gap-x-2 border-b border-line py-2.5 last:border-b-0"
            >
              <span
                className="flex size-10 items-center justify-center rounded-full text-base"
                style={{ backgroundColor: category.color }}
              >
                {category.emoji}
              </span>
              <span className="truncate font-semibold">{category.name}</span>
              {armedDelete === `category:${category.id}` ? (
                <>
                  <Button
                    variant="ghost"
                    size="auto"
                    className="h-11 w-full whitespace-nowrap text-sm"
                    onPress={() => setArmedDelete(null)}
                  >
                    Отмена
                  </Button>
                  <Button
                    variant="danger"
                    size="auto"
                    className="h-11 w-full px-1 text-sm"
                    onPress={() => {
                      setArmedDelete(null);
                      void removeCategory(category);
                    }}
                  >
                    Удалить
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="auto"
                    className="h-11 w-full whitespace-nowrap text-sm"
                    onPress={() => setCategoryDraft(category)}
                  >
                    Изменить
                  </Button>
                  <Button
                    variant="ghost"
                    size="auto"
                    className="h-11 w-full whitespace-nowrap text-sm"
                    onPress={() => setArmedDelete(`category:${category.id}`)}
                  >
                    Удалить
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section id="recurring" className="mt-4 scroll-mt-6 rounded-[28px] bg-surface p-4 shadow-card">
        <div className="flex items-center justify-between">
          <h2 id="recurring-title" tabIndex={-1} className="font-bold outline-none">
            Повторы
          </h2>
          <Button variant="secondary" onPress={() => setRecurringDraft("new")}>
            Добавить
          </Button>
        </div>
        <ul className="mt-3 flex flex-col gap-3">
          {snapshot.recurring.length === 0 ? (
            <li className="text-sm text-muted">Повторяющихся платежей нет.</li>
          ) : (
            snapshot.recurring.map((payment) => (
              <li key={payment.id} className="rounded-2xl border border-line p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {snapshot.categories.find((category) => category.id === payment.categoryId)?.name ??
                        "Без категории"}
                    </p>
                    <p className="text-xs text-muted tabular-nums">
                      {formatMoney(payment.amount)} ·{" "}
                      {frequencies.find((item) => item.id === payment.frequency)?.label}
                    </p>
                  </div>
                  <Switch
                    label="Включён"
                    isSelected={payment.enabled}
                    onChange={(enabled) => void run(() => client.setRecurringEnabled(payment.id, enabled, now()))}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="ghost" onPress={() => setRecurringDraft(payment)}>
                    Изменить
                  </Button>
                  {armedDelete === `recurring:${payment.id}` ? (
                    <>
                      <Button variant="secondary" onPress={() => setArmedDelete(null)}>
                        Отмена
                      </Button>
                      <Button
                        variant="danger"
                        onPress={() => {
                          setArmedDelete(null);
                          void run(() => client.deleteRecurring(payment.id));
                        }}
                      >
                        Удалить повтор
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" onPress={() => setArmedDelete(`recurring:${payment.id}`)}>
                      Удалить
                    </Button>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-4 rounded-[28px] bg-surface p-4 shadow-card">
        <h2 className="font-bold">Лимиты на месяц</h2>
        <ul className="mt-1">
          {snapshot.categories.map((category) => {
            const limit = snapshot.limits[category.id];
            const value = spent.get(category.id) ?? 0;
            const tone = limit === undefined ? null : limitTone(value, limit);
            const width = limit === undefined || limit === 0 ? 0 : Math.min(100, Math.round((value / limit) * 100));
            return (
              <li key={category.id} className="border-b border-line last:border-b-0">
                <Button
                  variant="bare"
                  size="auto"
                  aria-label={
                    limit === undefined
                      ? `${category.name}, лимит не задан`
                      : `${category.name}, лимит ${formatMoney(limit)}`
                  }
                  onPress={() => setLimitCategoryId(category.id)}
                  className="h-auto w-full justify-start px-0 py-2.5 text-left font-normal text-ink"
                >
                  <span className="grid w-full grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-2">
                    <span
                      className="flex size-10 items-center justify-center rounded-full text-base"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.emoji}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{category.name}</span>
                      {tone ? (
                        <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-line">
                          <span
                            className={`block h-full rounded-full ${
                              tone === "danger" ? "bg-danger" : tone === "warning" ? "bg-warning" : "bg-success"
                            }`}
                            style={{ width: `${width}%` }}
                          />
                        </span>
                      ) : null}
                    </span>
                    <span className={`text-sm ${tone === "danger" ? "font-semibold text-danger" : "text-muted"}`}>
                      {limit === undefined ? "Добавить" : formatMoney(limit)}
                    </span>
                  </span>
                </Button>
              </li>
            );
          })}
        </ul>
      </section>

      {categoryDraft ? (
        <CategoryModal
          category={categoryDraft === "new" ? null : categoryDraft}
          onClose={() => setCategoryDraft(null)}
          onSave={(input) =>
            void saveCategory(input, categoryDraft === "new" ? null : categoryDraft)
          }
        />
      ) : null}
      {recurringDraft ? (
        <RecurringModal
          categories={snapshot.categories}
          payment={recurringDraft === "new" ? null : recurringDraft}
          onClose={() => setRecurringDraft(null)}
          onSave={(input) =>
            run(async () => {
              if (recurringDraft === "new") {
                await client.addRecurring(input, now());
              } else {
                await client.updateRecurring(recurringDraft.id, input, now());
              }
              await client.catchUp(todayIso(), now());
              setRecurringDraft(null);
            })
          }
        />
      ) : null}
      {limitCategoryId ? (
        <LimitModal
          category={snapshot.categories.find((category) => category.id === limitCategoryId) ?? null}
          limit={snapshot.limits[limitCategoryId]}
          spent={spent.get(limitCategoryId) ?? 0}
          onClose={() => setLimitCategoryId(null)}
          onSave={(amount) => {
            void run(async () => {
              await client.setLimit(limitCategoryId, amount);
              setLimitCategoryId(null);
            });
          }}
          onClear={() => {
            void run(async () => {
              await client.setLimit(limitCategoryId, null);
              setLimitCategoryId(null);
            });
          }}
        />
      ) : null}
      {transfer ? (
        <Modal isOpen onOpenChange={() => setTransfer(null)} title="Перенести операции">
          <p className="text-sm text-muted">
            У категории есть операции или повторы. Выберите, куда их перенести.
          </p>
          <div className="mt-4">
            <Select
              label="Новая категория"
              selectedKey={transfer.target}
              onSelectionChange={(key) =>
                setTransfer({ ...transfer, target: key === null ? "" : String(key) })
              }
              options={snapshot.categories
                .filter((category) => category.id !== transfer.id)
                .map((category) => ({ id: category.id, label: category.name }))}
            />
          </div>
          <Button
            className="mt-4 w-full"
            onPress={() => {
              const result = applyDeleteCategory(snapshot, transfer.id, transfer.target, now());
              if (!result.ok) {
                onError("Выберите другую категорию");
                return;
              }
              void run(async () => {
                const deleted = await client.deleteCategory(transfer.id, transfer.target, now());
                if (!deleted.ok) {
                  throw new Error("Не удалось перенести операции");
                }
                setTransfer(null);
              });
            }}
          >
            Перенести и удалить
          </Button>
        </Modal>
      ) : null}
    </main>
  );
}

function LimitModal({
  category,
  limit,
  spent,
  onClose,
  onSave,
  onClear,
}: {
  category: Category | null;
  limit: number | undefined;
  spent: number;
  onClose: () => void;
  onSave: (amount: number) => void;
  onClear: () => void;
}) {
  const [amount, setAmount] = useState(limit === undefined ? "" : kopecksToInput(limit));
  const parsed = parseRublesToKopecks(amount);
  if (!category) {
    return null;
  }
  return (
    <Modal isOpen onOpenChange={(open) => !open && onClose()} title={category.name}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">В этом месяце потрачено {formatMoney(spent)}</p>
        <TextField
          label="Лимит, ₽"
          inputMode="decimal"
          value={amount}
          onChange={setAmount}
          placeholder="0,00"
        />
        <Button
          isDisabled={parsed === null}
          onPress={() => {
            if (parsed !== null) {
              onSave(parsed);
            }
          }}
        >
          Сохранить
        </Button>
        {limit !== undefined ? (
          <Button variant="danger" onPress={onClear}>
            Снять лимит
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}

function CategoryModal({
  category,
  onClose,
  onSave,
}: {
  category: Category | null;
  onClose: () => void;
  onSave: (input: CategoryInput) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [emoji, setEmoji] = useState(category?.emoji ?? "📦");
  const [color, setColor] = useState(category?.color ?? categoryColors[0]);
  const [error, setError] = useState<string | null>(null);
  return (
    <Modal isOpen onOpenChange={(open) => !open && onClose()} title={category ? "Категория" : "Новая категория"}>
      <div className="flex flex-col gap-4">
        <TextField
          label="Название"
          value={name}
          onChange={(value) => {
            setName(value);
            if (error === "Введите название") {
              setError(null);
            }
          }}
          errorMessage={error === "Введите название" ? error : undefined}
        />
        <TextField
          label="Эмодзи"
          value={emoji}
          onChange={(value) => {
            setEmoji(value);
            if (error === "Добавьте эмодзи") {
              setError(null);
            }
          }}
          errorMessage={error === "Добавьте эмодзи" ? error : undefined}
        />
        <div className="flex flex-wrap gap-2">
          {categoryColors.map((item) => (
            <Button
              key={item}
              aria-label={item}
              aria-pressed={color === item}
              size="inline"
              onPress={() => setColor(item)}
              className="size-8"
              style={{ backgroundColor: item }}
            >
              {color === item ? "✓" : ""}
            </Button>
          ))}
        </div>
        <Button
          onPress={() => {
            const message = validateCategory({ name, emoji, color });
            if (message) {
              setError(message);
              return;
            }
            setError(null);
            onSave({ name, emoji, color });
          }}
        >
          Сохранить
        </Button>
      </div>
    </Modal>
  );
}

function RecurringModal({
  categories,
  payment,
  onClose,
  onSave,
}: {
  categories: Category[];
  payment: RecurringPayment | null;
  onClose: () => void;
  onSave: (input: RecurringInput) => Promise<void>;
}) {
  const [amount, setAmount] = useState(payment ? kopecksToInput(payment.amount) : "");
  const [type, setType] = useState(payment?.type ?? "expense");
  const [categoryId, setCategoryId] = useState(payment?.categoryId ?? categories[0]?.id ?? "");
  const [frequency, setFrequency] = useState(payment?.frequency ?? "monthly");
  const [startDate, setStartDate] = useState(payment?.startDate ?? todayIso());
  const [endDate, setEndDate] = useState(payment?.endDate ?? "");
  const [enabled, setEnabled] = useState(payment?.enabled ?? true);
  const [error, setError] = useState<string | null>(null);
  return (
    <Modal isOpen onOpenChange={(open) => !open && onClose()} title="Повторяющийся платёж">
      <div className="flex flex-col gap-4">
        <TextField
          label="Сумма, ₽"
          inputMode="decimal"
          value={amount}
          onChange={(value) => {
            setAmount(value);
            setError(null);
          }}
          placeholder="0,00"
          errorMessage={error ?? undefined}
        />
        <Select
          label="Тип"
          selectedKey={type}
          onSelectionChange={(key) => setType(key === "income" ? "income" : "expense")}
          options={[
            { id: "expense", label: "Расход" },
            { id: "income", label: "Доход" },
          ]}
        />
        <Select
          label="Категория"
          selectedKey={categoryId}
          onSelectionChange={(key) => setCategoryId(String(key ?? ""))}
          options={categories.map((category) => ({ id: category.id, label: category.name }))}
        />
        <Select
          label="Периодичность"
          selectedKey={frequency}
          onSelectionChange={(key) => {
            if (key === "daily" || key === "weekly" || key === "monthly" || key === "yearly") {
              setFrequency(key);
            }
          }}
          options={frequencies}
        />
        <DateField label="Дата начала" value={startDate} onChange={setStartDate} />
        <DateField label="Дата окончания" value={endDate} onChange={setEndDate} />
        <Switch label="Включён" isSelected={enabled} onChange={setEnabled} />
        <Button
          onPress={() => {
            const parsed = parseRublesToKopecks(amount);
            if (parsed === null || parsed <= 0) {
              setError("Введите сумму больше нуля");
              return;
            }
            setError(null);
            void onSave({
              amount: parsed,
              type,
              categoryId,
              frequency,
              startDate,
              endDate: endDate || null,
              enabled,
            });
          }}
        >
          Сохранить
        </Button>
      </div>
    </Modal>
  );
}
