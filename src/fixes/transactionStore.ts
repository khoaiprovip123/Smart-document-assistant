import type { SemanticDocumentSnapshot } from "../word/documentModel";

export interface ChangeTransaction {
  id: string;
  label: string;
  before: SemanticDocumentSnapshot;
  findingIds: readonly string[];
  createdAt?: string;
}

export interface ChangeTransactionStore {
  record(transaction: ChangeTransaction): void;
  history(): readonly ChangeTransaction[];
  peek(): ChangeTransaction | undefined;
  pop(): ChangeTransaction | undefined;
  clear(): void;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested);
    }
  }
  return value;
}

function cloneTransaction(transaction: ChangeTransaction): ChangeTransaction {
  const cloned = structuredClone(transaction) as ChangeTransaction;
  return deepFreeze({
    ...cloned,
    findingIds: Object.freeze([...cloned.findingIds])
  });
}

export function createTransactionStore(maxEntries = 20): ChangeTransactionStore {
  if (!Number.isInteger(maxEntries) || maxEntries < 1) {
    throw new Error("Transaction history size must be a positive integer.");
  }

  const transactions: ChangeTransaction[] = [];

  return {
    record(transaction) {
      transactions.push(cloneTransaction(transaction));
      if (transactions.length > maxEntries) {
        transactions.splice(0, transactions.length - maxEntries);
      }
    },
    history() {
      return Object.freeze([...transactions]);
    },
    peek() {
      return transactions.at(-1);
    },
    pop() {
      return transactions.pop();
    },
    clear() {
      transactions.length = 0;
    }
  };
}

function sameIndexedStructure<T extends { index: number }>(
  expected: readonly T[],
  current: readonly T[]
): boolean {
  if (expected.length !== current.length) return false;
  return expected.every((item, position) => current[position]?.index === item.index);
}

export function hasSameSemanticRollbackStructure(
  expected: SemanticDocumentSnapshot,
  current: SemanticDocumentSnapshot
): boolean {
  if (expected.paragraphs.length !== current.paragraphs.length) return false;

  const paragraphsMatch = expected.paragraphs.every((saved, position) => {
    const candidate = current.paragraphs[position];
    if (!candidate) return false;
    if (candidate.index !== saved.index) return false;
    if (candidate.text !== saved.text) return false;
    if (saved.uniqueLocalId && candidate.uniqueLocalId && saved.uniqueLocalId !== candidate.uniqueLocalId) return false;
    return true;
  });

  if (!paragraphsMatch) return false;
  if (!sameIndexedStructure(expected.sections, current.sections)) return false;
  if (!sameIndexedStructure(expected.tables, current.tables)) return false;
  if (!sameIndexedStructure(expected.fields, current.fields)) return false;
  if (!sameIndexedStructure(expected.inlinePictures, current.inlinePictures)) return false;
  if (expected.comments.length !== current.comments.length) return false;
  if (expected.trackedChanges.length !== current.trackedChanges.length) return false;

  return true;
}

export function assertSemanticRollbackSafe(
  expected: SemanticDocumentSnapshot,
  current: SemanticDocumentSnapshot
): void {
  if (!hasSameSemanticRollbackStructure(expected, current)) {
    throw new Error(
      "Rollback bị chặn vì nội dung hoặc cấu trúc tài liệu đã thay đổi kể từ transaction gần nhất."
    );
  }
}
