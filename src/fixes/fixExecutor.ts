import { selectFixAllSafe } from "./fixPolicy";
import type { ChangeTransactionStore } from "./transactionStore";
import type { QualityFindingV2 } from "../quality/types";
import type { SemanticDocumentSnapshot } from "../word/documentModel";

export interface ExecuteFixAllSafeInput {
  findings: readonly QualityFindingV2[];
  approvedPreviewFindingIds?: ReadonlySet<string>;
  before: SemanticDocumentSnapshot;
  store: ChangeTransactionStore;
  apply: (finding: QualityFindingV2) => Promise<void> | void;
  transactionId: string;
  label?: string;
}

export interface ExecuteFixAllSafeResult {
  transactionId?: string;
  appliedFindingIds: readonly string[];
  skippedFindingIds: readonly string[];
}

export async function executeFixAllSafe(
  input: ExecuteFixAllSafeInput
): Promise<ExecuteFixAllSafeResult> {
  const selected = selectFixAllSafe(
    input.findings,
    input.approvedPreviewFindingIds ?? new Set<string>()
  );
  const selectedIds = new Set(selected.map((finding) => finding.id));
  const skippedFindingIds = Object.freeze(
    input.findings.filter((finding) => !selectedIds.has(finding.id)).map((finding) => finding.id)
  );

  if (selected.length === 0) {
    return Object.freeze({
      appliedFindingIds: Object.freeze([] as string[]),
      skippedFindingIds
    });
  }

  const appliedFindingIds = Object.freeze(selected.map((finding) => finding.id));

  input.store.record({
    id: input.transactionId,
    label: input.label ?? `Fix All Safe (${selected.length})`,
    before: input.before,
    findingIds: appliedFindingIds
  });

  for (const finding of selected) {
    await input.apply(finding);
  }

  return Object.freeze({
    transactionId: input.transactionId,
    appliedFindingIds,
    skippedFindingIds
  });
}
