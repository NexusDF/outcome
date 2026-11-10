import type { LedgerClient } from "./client";
import { createLocalLedger } from "./localLedger";

export function createLedger(now: string): LedgerClient {
  return createLocalLedger(now);
}
