import type { SemanticRole } from "../word/documentModel";

export type LayoutMarginSide = "top" | "bottom" | "left" | "right";

export type QualityRequirement =
  | { kind: "layout-paper-size"; expected: string }
  | { kind: "layout-orientation"; expected: string }
  | { kind: "layout-margin-range"; side: LayoutMarginSide; minPt: number; maxPt: number; preferredPt: number }
  | { kind: "typography-font"; roles: readonly SemanticRole[]; allowedFontNames: readonly string[] }
  | { kind: "typography-size-range"; roles: readonly SemanticRole[]; minPt: number; maxPt: number; preferredPt: number }
  | { kind: "typography-alignment"; roles: readonly SemanticRole[]; expected: string }
  | { kind: "structure-required-heading"; text: string }
  | { kind: "heading-max-level-jump"; maxJump: number }
  | { kind: "table-require-header-row" }
  | { kind: "text-no-double-spaces" }
  | { kind: "text-punctuation-spacing" }
  | { kind: "release-no-comments" }
  | { kind: "release-no-tracked-changes" };

export function isQualityRequirement(value: unknown): value is QualityRequirement {
  return Boolean(value && typeof value === "object" && "kind" in value && typeof (value as { kind?: unknown }).kind === "string");
}
