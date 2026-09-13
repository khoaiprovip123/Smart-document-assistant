import type { DocumentSnapshot } from "../types";

let lastSnapshot: DocumentSnapshot | null = null;

export function hasSameDocumentStructure(expected: DocumentSnapshot, current: DocumentSnapshot): boolean {
  if (expected.paragraphs.length !== current.paragraphs.length) return false;

  return expected.paragraphs.every((saved, position) => {
    const candidate = current.paragraphs[position];
    return Boolean(candidate && candidate.index === saved.index && candidate.text === saved.text);
  });
}

export function assertRollbackSafe(expected: DocumentSnapshot, current: DocumentSnapshot): void {
  if (!hasSameDocumentStructure(expected, current)) {
    throw new Error(
      "Tài liệu đã thay đổi nội dung hoặc cấu trúc kể từ lần sửa gần nhất. Rollback đã bị chặn để tránh áp định dạng sai đoạn."
    );
  }
}

export const rollbackStore = {
  save(snapshot: DocumentSnapshot) {
    lastSnapshot = structuredClone(snapshot);
  },
  get(): DocumentSnapshot | null {
    return lastSnapshot ? structuredClone(lastSnapshot) : null;
  },
  clear() {
    lastSnapshot = null;
  }
};
