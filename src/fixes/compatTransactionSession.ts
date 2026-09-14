import { createTransactionStore, type ChangeTransactionStore } from "./transactionStore";
import type { SemanticDocumentSnapshot } from "../word/documentModel";

export const compatibilityTransactionStore: ChangeTransactionStore = createTransactionStore(20);

export function recordCompatibilityTransaction(input: {
  label: string;
  before: SemanticDocumentSnapshot;
  findingIds?: readonly string[];
}): string {
  const id = `compat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  compatibilityTransactionStore.record({
    id,
    label: input.label,
    before: input.before,
    findingIds: Object.freeze([...(input.findingIds ?? [])]),
    createdAt: new Date().toISOString()
  });
  return id;
}

export function discardCompatibilityTransaction(id: string): void {
  if (compatibilityTransactionStore.peek()?.id === id) compatibilityTransactionStore.pop();
}

export function consumeLatestCompatibilityTransaction(): void {
  compatibilityTransactionStore.pop();
}
