import { getFirebase, isFirebaseConfigured } from "../lib/firebase";
import type { LedgerClient } from "./client";
import { createFirebaseLedger } from "./firebaseLedger";
import { createMemoryLedger } from "./memoryLedger";

export function createLedger(now: string, uid: string | null): LedgerClient {
  if (uid && isFirebaseConfigured()) {
    return createFirebaseLedger(getFirebase().db, uid);
  }
  return createMemoryLedger(now);
}
