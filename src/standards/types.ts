export type SourceType =
  | "law"
  | "institution"
  | "publisher"
  | "standard"
  | "style-guide"
  | "template"
  | "custom";

export interface StandardSource {
  id: string;
  title: string;
  issuer: string;
  sourceType: SourceType;
  url?: string;
  publicationDate?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  verifiedAt?: string;
}

export interface StandardSourceRegistry {
  all(): readonly StandardSource[];
  has(id: string): boolean;
  get(id: string): StandardSource | undefined;
  require(id: string): StandardSource;
}

export type FixPolicy = "auto-safe" | "auto-with-preview" | "review-required" | "never-auto-fix";

export type RuleCategory =
  | "layout"
  | "typography"
  | "structure"
  | "heading-numbering"
  | "table-figure-equation"
  | "citation-reference"
  | "accessibility"
  | "language-consistency"
  | "release-hygiene";

export interface RuleScope {
  documentFamilies?: readonly string[];
  documentTypes?: readonly string[];
  profileTags?: readonly string[];
}

export interface StandardRule<T = unknown> {
  id: string;
  title: string;
  category: RuleCategory;
  requirement: T;
  severity: "critical" | "warning" | "suggestion" | "info";
  fixPolicy: FixPolicy;
  sourceId: string;
  sourceLocator?: string;
  scope: RuleScope;
  enabled: boolean;
}

export interface StandardRuleRegistry {
  all(): readonly StandardRule[];
  has(id: string): boolean;
  get(id: string): StandardRule | undefined;
  require(id: string): StandardRule;
}
