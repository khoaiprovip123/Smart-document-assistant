import { hasSameSemanticRollbackStructure, type ChangeTransaction } from "./transactionStore";
import type { SemanticDocumentSnapshot } from "../word/documentModel";

export interface TransactionHistoryItem {
  id: string;
  label: string;
  createdAt?: string;
  findingCount: number;
  findingIds: readonly string[];
  isLatest: boolean;
  rollbackEligible: boolean;
}

export function buildTransactionHistoryView(
  history: readonly ChangeTransaction[],
  currentDocument?: SemanticDocumentSnapshot
): readonly TransactionHistoryItem[] {
  const latest = history.at(-1);

  return Object.freeze([...history].reverse().map((transaction) => {
    const isLatest = transaction === latest;
    const rollbackEligible = Boolean(
      isLatest && currentDocument && hasSameSemanticRollbackStructure(transaction.before, currentDocument)
    );

    return Object.freeze({
      id: transaction.id,
      label: transaction.label,
      createdAt: transaction.createdAt,
      findingCount: transaction.findingIds.length,
      findingIds: Object.freeze([...transaction.findingIds]),
      isLatest,
      rollbackEligible
    });
  }));
}
