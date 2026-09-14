import type { FindingProvenance } from "../types";
import type { FixPolicy, RuleCategory } from "../standards/types";

export interface QualityFindingLocation {
  sectionIndex?: number;
  paragraphIndex?: number;
  tableIndex?: number;
}

export interface QualityFindingV2 {
  id: string;
  ruleId: string;
  category: RuleCategory;
  severity: "critical" | "warning" | "suggestion" | "info";
  title: string;
  message: string;
  current?: unknown;
  expected?: unknown;
  location?: QualityFindingLocation;
  fixPolicy: FixPolicy;
  provenance: FindingProvenance;
}
