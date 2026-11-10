export function readableError(caught: unknown): string {
  if (caught instanceof Error && /[А-Яа-яЁё]/.test(caught.message)) {
    return caught.message;
  }
  return "Не удалось сохранить изменения";
}
