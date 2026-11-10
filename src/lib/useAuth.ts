import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { getFirebase, isFirebaseConfigured } from "./firebase";

type AuthState = {
  status: "loading" | "ready";
  uid: string | null;
};

export function useAuthUser(): AuthState {
  const configured = isFirebaseConfigured();
  const [state, setState] = useState<AuthState>(
    configured ? { status: "loading", uid: null } : { status: "ready", uid: null },
  );

  useEffect(() => {
    if (!configured) {
      return;
    }
    return onAuthStateChanged(getFirebase().auth, (user) => {
      setState({ status: "ready", uid: user?.uid ?? null });
    });
  }, [configured]);

  return state;
}
