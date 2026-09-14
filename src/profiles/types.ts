export type ProfileLayer =
  | "legal"
  | "institution-publisher"
  | "document-template"
  | "citation-editorial"
  | "house-style"
  | "custom"
  | "generic";

export interface ProfileRef {
  id: string;
  version: string;
}

export interface ProfileRuleBinding {
  ruleId: string;
  enabled: boolean;
  requirementOverride?: unknown;
}

export interface StandardProfile {
  id: string;
  version: string;
  name: string;
  status: "draft" | "unverified" | "verified" | "retired";
  layer: ProfileLayer;
  sourceIds: readonly string[];
  parent?: ProfileRef;
  tags?: readonly string[];
  effectiveFrom?: string;
  effectiveTo?: string;
  ruleBindings: readonly ProfileRuleBinding[];
}

export interface StandardProfileRegistry {
  all(): readonly StandardProfile[];
  get(ref: ProfileRef): StandardProfile | undefined;
  require(ref: ProfileRef): StandardProfile;
}
