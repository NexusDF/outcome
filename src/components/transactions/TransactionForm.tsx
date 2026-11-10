import { useState } from "react";
import { todayIso } from "../../domain/dates";
import { kopecksToInput, parseRublesToKopecks } from "../../domain/money";
import { validateTransaction } from "../../domain/transactions";
import type { Category, Transaction, TransactionInput, TransactionType } from "../../domain/types";
import { readableError } from "../../lib/errors";
import { Button } from "../ui/Button";
import { DateField } from "../ui/DateField";
import { Modal } from "../ui/Modal";
import { Select } from "../ui/Select";
import { TextField } from "../ui/TextField";

type FieldError = {
  field: "amount" | "category" | "date";
  message: string;
};

type TransactionFormProps = {
  categories: Category[];
  transaction: Transaction | null;
  initialType: TransactionType;
  onClose: () => void;
  onSave: (input: TransactionInput) => Promise<void>;
  onDelete: (() => Promise<void>) | null;
};

export function TransactionForm({
  categories,
  transaction,
  initialType,
  onClose,
  onSave,
  onDelete,
}: TransactionFormProps) {
  const [amount, setAmount] = useState(transaction ? kopecksToInput(transaction.amount) : "");
  const [type, setType] = useState<TransactionType>(transaction?.type ?? initialType);
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? categories[0]?.id ?? "");
  const [date, setDate] = useState(transaction?.date ?? todayIso());
  const [note, setNote] = useState(transaction?.note ?? "");
  const [error, setError] = useState<FieldError | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save(): Promise<void> {
    const parsed = parseRublesToKopecks(amount);
    const input: TransactionInput = {
      amount: parsed ?? 0,
      type,
      categoryId,
      date,
      note,
    };
    const message = validateTransaction(input);
    if (message) {
      if (!Number.isInteger(input.amount) || input.amount <= 0) {
        setError({ field: "amount", message });
      } else if (input.categoryId.length === 0) {
        setError({ field: "category", message });
      } else {
        setError({ field: "date", message });
      }
      return;
    }
    setError(null);
    setSaveError(null);
    try {
      await onSave(input);
    } catch (caught) {
      setSaveError(readableError(caught));
    }
  }

  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={transaction ? "Операция" : type === "income" ? "Доход" : "Расход"}
    >
      <div className="flex flex-col gap-4">
        <TextField
          label="Сумма, ₽"
          inputMode="decimal"
          autoFocus
          value={amount}
          onChange={(value) => {
            setAmount(value);
            if (error?.field === "amount") {
              setError(null);
            }
          }}
          placeholder="0,00"
          errorMessage={error?.field === "amount" ? error.message : undefined}
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
          onSelectionChange={(key) => {
            setCategoryId(key === null ? "" : String(key));
            if (error?.field === "category") {
              setError(null);
            }
          }}
          options={categories.map((category) => ({
            id: category.id,
            label: `${category.emoji} ${category.name}`,
          }))}
          errorMessage={error?.field === "category" ? error.message : undefined}
        />
        <DateField
          label="Дата"
          value={date}
          onChange={(value) => {
            setDate(value);
            if (error?.field === "date") {
              setError(null);
            }
          }}
          errorMessage={error?.field === "date" ? error.message : undefined}
        />
        <TextField label="Заметка" value={note} onChange={setNote} placeholder="Например, обед" />
        {saveError ? <p className="text-sm text-danger">{saveError}</p> : null}
        <Button onPress={() => void save()}>Сохранить</Button>
        {onDelete ? (
          confirmDelete ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onPress={() => setConfirmDelete(false)}>
                Отмена
              </Button>
              <Button
                variant="danger"
                className="px-3"
                onPress={() => {
                  void onDelete().catch((caught: unknown) => setSaveError(readableError(caught)));
                }}
              >
                Удалить операцию?
              </Button>
            </div>
          ) : (
            <Button variant="danger" onPress={() => setConfirmDelete(true)}>
              Удалить
            </Button>
          )
        ) : null}
      </div>
    </Modal>
  );
}
