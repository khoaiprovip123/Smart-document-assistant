import { getFixDisposition, type FixDisposition } from "./fixPolicy";
import type { QualityFindingV2 } from "../quality/types";

export interface FixPreviewItem {
  findingId: string;
  ruleId: string;
  title: string;
  message: string;
  current?: unknown;
  expected?: unknown;
  disposition: FixDisposition;
  sourceLabel: string;
  sourceUrl?: string;
}

function buildSourceLabel(finding: QualityFindingV2): string {
  const { sourceTitle, issuer, sourceLocator } = finding.provenance;
  const locator = sourceLocator ? ` — ${sourceLocator}` : "";
  return `${sourceTitle} (${issuer})${locator}`;
}

export function buildFixPreview(findings: readonly QualityFindingV2[]): readonly FixPreviewItem[] {
  return Object.freeze(
    findings.map((finding) => Object.freeze({
      findingId: finding.id,
      ruleId: finding.ruleId,
      title: finding.title,
      message: finding.message,
      current: finding.current,
      expected: finding.expected,
      disposition: getFixDisposition(finding),
      sourceLabel: buildSourceLabel(finding),
      sourceUrl: finding.provenance.sourceUrl
    }))
  );
}
