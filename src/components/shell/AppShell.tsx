import { signOut } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import type { LedgerClient } from "../../data/client";
import { createLedger } from "../../data/createLedger";
import { currentMonth, formatDay, formatMonth, greeting, shiftMonth, todayIso } from "../../domain/dates";
import { limitTone, overLimitCategories } from "../../domain/limits";
import { balanceChange, monthBalance, spentByCategory, topExpenseCategories } from "../../domain/transactions";
import { formatMoney, formatPercent, formatSignedMoney } from "../../domain/money";
import { emptyFilters, type LedgerSnapshot, type Transaction, type TransactionFilters, type TransactionType } from "../../domain/types";
import { getFirebase, isFirebaseConfigured } from "../../lib/firebase";
import { readableError } from "../../lib/errors";
import { applyTheme } from "../../lib/theme";
import { Button } from "../ui/Button";
import { AnalyticsScreen } from "../analytics/AnalyticsScreen";
import { BottomNav, type AppScreen } from "../home/BottomNav";
import { HomeScreen } from "../home/HomeScreen";
import type { ActionId } from "../home/QuickActions";
import { ProfileScreen } from "../profile/ProfileScreen";
import { OperationsScreen } from "../transactions/OperationsScreen";
import { TransactionForm } from "../transactions/TransactionForm";

type Editor = {
  type: TransactionType;
  transaction: Transaction | null;
};

export function AppShell({ uid }: { uid: string | null }) {
  const [client] = useState(() => createLedger(new Date().toISOString(), uid));
  const [snapshot, setSnapshot] = useState<LedgerSnapshot | null>(null);
  const [screen, setScreen] = useState<AppScreen>("home");
  const [hidden, setHidden] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>(emptyFilters);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focusSearch, setFocusSearch] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<"recurring" | null>(null);
  const clearProfileAnchor = useCallback(() => setProfileAnchor(null), []);

  useEffect(() => {
    const unsubscribe = client.subscribe(setSnapshot);
    void client
      .whenReady()
      .then(() => client.catchUp(todayIso(), new Date().toISOString()))
      .catch((caught: unknown) => setError(readableError(caught)));
    return unsubscribe;
  }, [client]);

  useEffect(() => {
    if (snapshot) {
      applyTheme(snapshot.theme);
    }
  }, [snapshot]);

  if (!snapshot) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[390px] items-center justify-center px-5 pt-[env(safe-area-inset-top)] text-sm text-muted">
        Загрузка…
      </div>
    );
  }

  const month = currentMonth();
  const balance = monthBalance(snapshot.transactions, month);
  const previous = monthBalance(snapshot.transactions, shiftMonth(month, -1));
  const change = balanceChange(balance, previous);
  const names = new Map(snapshot.categories.map((category) => [category.id, category]));
  const rows = [...snapshot.transactions]
    .sort((left, right) => right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt))
    .slice(0, 5)
    .map((transaction) => {
      const category = names.get(transaction.categoryId);
      return {
        id: transaction.id,
        title: transaction.note || category?.name || "Без категории",
        detail: transaction.note ? category?.name ?? "Без категории" : transaction.type === "income" ? "Доход" : "Расход",
        amount: formatSignedMoney(transaction.amount, transaction.type === "income"),
        date: formatDay(transaction.date),
        income: transaction.type === "income",
        emoji: category?.emoji ?? "📦",
        color: category?.color ?? "#7E8882",
      };
    });
  const spent = spentByCategory(snapshot.transactions, month);
  const expenseTotal = [...spent.values()].reduce((sum, value) => sum + value, 0);
  const incomeTotal = snapshot.transactions.reduce((sum, transaction) => {
    if (transaction.type !== "income" || !transaction.date.startsWith(month)) {
      return sum;
    }
    return sum + transaction.amount;
  }, 0);
  const limitRows = snapshot.categories.flatMap((category) => {
    const limit = snapshot.limits[category.id];
    if (limit === undefined) {
      return [];
    }
    const value = spent.get(category.id) ?? 0;
    return [
      {
        id: category.id,
        name: category.name,
        emoji: category.emoji,
        spent: formatMoney(value),
        width: limit === 0 ? 100 : Math.min(100, Math.round((value / limit) * 100)),
        tone: limitTone(value, limit),
      },
    ];
  });
  const over = overLimitCategories(spent, snapshot.limits)
    .map((id) => names.get(id)?.name)
    .filter((name): name is string => name !== undefined);

  function openEditor(type: TransactionType, transaction: Transaction | null = null): void {
    setEditor({ type, transaction });
  }

  function onAction(id: ActionId): void {
    if (id === "income" || id === "expense") {
      openEditor(id);
      return;
    }
    setProfileAnchor("recurring");
    setScreen("profile");
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[390px] bg-canvas pt-[env(safe-area-inset-top)] text-ink">
      {screen === "home" ? (
        <HomeScreen
          greeting={greeting()}
          monthLabel={formatMonth(month)}
          hidden={hidden}
          amount={formatMoney(balance)}
          changeLabel={change === null ? null : formatPercent(change)}
          positive={(change ?? 0) >= 0}
          rows={rows}
          income={formatMoney(incomeTotal)}
          expense={formatMoney(expenseTotal)}
          limits={limitRows}
          top={topExpenseCategories(snapshot.transactions, snapshot.categories, month).map((item) => ({
            id: item.category.id,
            emoji: item.category.emoji,
            name: item.category.name,
            amount: formatMoney(item.amount),
          }))}
          warning={over.length > 0 ? `Лимит превышен: ${over.join(", ")}` : null}
          onToggleHidden={() => setHidden((value) => !value)}
          onAction={onAction}
          onOpen={(id) => {
            const transaction = snapshot.transactions.find((item) => item.id === id);
            if (transaction) {
              openEditor(transaction.type, transaction);
            }
          }}
          onSeeAll={() => setScreen("operations")}
          onSearch={() => {
            setFocusSearch(true);
            setScreen("operations");
          }}
          notice={
            client.mode === "memory" ? "После обновления страницы операции исчезнут." : null
          }
        />
      ) : null}
      {screen === "analytics" ? (
        <AnalyticsScreen
          transactions={snapshot.transactions}
          categories={snapshot.categories}
          limits={snapshot.limits}
        />
      ) : null}
      {screen === "operations" ? (
        <OperationsScreen
          transactions={snapshot.transactions}
          categories={snapshot.categories}
          filters={filters}
          focusSearch={focusSearch}
          onSearchFocused={() => setFocusSearch(false)}
          onCreate={() => openEditor("expense")}
          onFilters={(patch) => setFilters((current) => ({ ...current, ...patch }))}
          onOpen={(id) => {
            const transaction = snapshot.transactions.find((item) => item.id === id);
            if (transaction) {
              openEditor(transaction.type, transaction);
            }
          }}
        />
      ) : null}
      {screen === "profile" ? (
        <ProfileScreen
          snapshot={snapshot}
          client={client}
          scrollTo={profileAnchor}
          onScrolled={clearProfileAnchor}
          onError={setError}
          onSignOut={
            isFirebaseConfigured() && uid
              ? () => signOut(getFirebase().auth)
              : null
          }
        />
      ) : null}
      {error ? (
        <div className="fixed bottom-[5.5rem] left-1/2 z-30 w-full max-w-[390px] -translate-x-1/2 px-5">
          <p role="alert" className="flex items-start justify-between gap-3 rounded-2xl bg-[#F8E8EA] px-4 py-3 text-sm text-danger">
            <span>{error}</span>
            <Button variant="bare" size="auto" aria-label="Закрыть сообщение" onPress={() => setError(null)} className="text-danger">
              Закрыть
            </Button>
          </p>
        </div>
      ) : null}
      <BottomNav screen={screen} onScreen={setScreen} onCreate={() => openEditor("expense")} />
      {editor ? (
        <TransactionForm
          categories={snapshot.categories}
          transaction={editor.transaction}
          initialType={editor.type}
          onClose={() => setEditor(null)}
          onSave={async (input) => {
            const stamp = new Date().toISOString();
            if (editor.transaction) {
              await client.updateTransaction(editor.transaction.id, input, stamp);
            } else {
              await client.addTransaction(input, stamp);
            }
            setEditor(null);
            setError(null);
          }}
          onDelete={
            editor.transaction
              ? async () => {
                  await client.deleteTransaction(editor.transaction!.id);
                  setEditor(null);
                }
              : null
          }
        />
      ) : null}
    </div>
  );
}

export type { LedgerClient };
