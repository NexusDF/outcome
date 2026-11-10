import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { useState } from "react";
import { getFirebase } from "../../lib/firebase";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";

function authMessage(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
    return "Неверный email или пароль";
  }
  if (code === "auth/email-already-in-use") {
    return "Этот email уже зарегистрирован";
  }
  if (code === "auth/popup-closed-by-user") {
    return "Окно входа закрыто";
  }
  return "Не удалось войти";
}

export function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>): Promise<void> {
    try {
      setError(null);
      await action();
    } catch (caught) {
      setError(authMessage(caught));
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col justify-center bg-canvas px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <section className="rounded-[28px] bg-[#1B4332] px-5 py-8 text-white">
        <h1 className="text-[28px] leading-none font-extrabold">Листок</h1>
        <p className="mt-3 text-sm text-white/75">Войдите, чтобы хранить операции в Firebase.</p>
      </section>
      <div className="mt-6 flex flex-col gap-4">
        <TextField label="Email" type="email" value={email} onChange={setEmail} />
        <TextField label="Пароль" type="password" value={password} onChange={setPassword} />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button
          onPress={() =>
            void run(() => signInWithEmailAndPassword(getFirebase().auth, email.trim(), password))
          }
        >
          Войти
        </Button>
        <Button
          variant="secondary"
          onPress={() =>
            void run(() =>
              createUserWithEmailAndPassword(getFirebase().auth, email.trim(), password),
            )
          }
        >
          Создать аккаунт
        </Button>
        <Button
          variant="secondary"
          onPress={() =>
            void run(() => signInWithPopup(getFirebase().auth, new GoogleAuthProvider()))
          }
        >
          Войти через Google
        </Button>
      </div>
    </div>
  );
}
