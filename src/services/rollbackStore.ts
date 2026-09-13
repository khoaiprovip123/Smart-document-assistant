import type { DocumentSnapshot } from "../types";

let lastSnapshot: DocumentSnapshot | null = null;

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
