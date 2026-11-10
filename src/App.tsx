import { AppShell } from "./components/shell/AppShell";
import { AuthScreen } from "./components/auth/AuthScreen";
import { isFirebaseConfigured } from "./lib/firebase";
import { useAuthUser } from "./lib/useAuth";

export default function App() {
  const auth = useAuthUser();

  if (!isFirebaseConfigured()) {
    return <AppShell uid={null} />;
  }
  if (auth.status === "loading") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[390px] items-center justify-center px-5 pt-[env(safe-area-inset-top)] text-sm text-muted">
        Загрузка…
      </div>
    );
  }
  if (!auth.uid) {
    return <AuthScreen />;
  }
  return <AppShell uid={auth.uid} />;
}
