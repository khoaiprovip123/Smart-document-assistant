export type Severity = "critical" | "warning" | "suggestion" | "passed";
export type FindingScope = "document" | "section" | "paragraph" | "structure" | "capability" | "table";
export type HeadingLevel = 1 | 2 | 3 | 4;
export type ParagraphRole =
  | "body"
  | "heading"
  | "list"
  | "title"
  | "subtitle"
  | "caption"
  | "signature"
  | "recipient"
  | "note"
  | "appendix"
  | "tableText"
  | "unknown";
export type ClassificationConfidence = "explicit" | "metadata" | "heuristic" | "fallback";

export interface ParagraphRoleInfo {
  role: ParagraphRole;
  confidence: ClassificationConfidence;
  headingLevel?: HeadingLevel;
  listLevel?: number;
}

export interface NumericRule {
  min: number;
  max: number;
  preferred: number;
  unit: "mm" | "pt";
}

export interface MarginRuleSet {
  top: NumericRule;
  bottom: NumericRule;
  left: NumericRule;
  right: NumericRule;
}

export interface ParagraphRuleSet {
  fontName: string;
  fontSize: NumericRule;
  alignment: "Left" | "Centered" | "Right" | "Justified";
  firstLineIndentMm?: NumericRule;
  spaceBeforePt?: NumericRule;
  spaceAfterPt?: NumericRule;
  lineSpacingPt?: NumericRule;
  bold?: boolean;
  italic?: boolean;
}

export interface DocumentRuleProfile {
  id: string;
  name: string;
  version: string;
  status: "draft" | "approved";
  description: string;
  source?: string;
  page: {
    paperSize: "A4";
    orientation: "Portrait" | "Landscape";
    margins: MarginRuleSet;
  };
  body: ParagraphRuleSet;
  headings?: Partial<Record<HeadingLevel, ParagraphRuleSet>>;
  sopRequiredSections?: string[];
}

export interface ParagraphSnapshot {
  index: number;
  text: string;
  style?: string;
  fontName?: string;
  fontSize?: number;
  alignment?: string;
  firstLineIndentPt?: number;
  spaceBeforePt?: number;
  spaceAfterPt?: number;
  lineSpacingPt?: number;
  listLevel?: number;
  listString?: string;
  role?: ParagraphRole;
  headingLevel?: HeadingLevel;
}

export interface TableSnapshot {
  index: number;
  rowCount?: number;
  columnCount?: number;
  style?: string;
  headerRowCount?: number;
}

export interface DocumentSnapshot {
  supportsPageSetup: boolean;
  pageSetup?: {
    paperSize?: string;
    orientation?: string;
    topMarginPt?: number;
    bottomMarginPt?: number;
    leftMarginPt?: number;
    rightMarginPt?: number;
  };
  paragraphs: ParagraphSnapshot[];
  tables?: TableSnapshot[];
}

export interface FindingFix {
  fontName?: string;
  fontSize?: number;
  alignment?: ParagraphRuleSet["alignment"];
  firstLineIndentPt?: number;
  spaceBeforePt?: number;
  spaceAfterPt?: number;
  lineSpacingPt?: number;
}

export interface FindingProvenance {
  sourceId: string;
  sourceTitle: string;
  issuer: string;
  sourceLocator?: string;
  sourceUrl?: string;
  profileId: string;
  profileVersion: string;
}

export interface Finding {
  id: string;
  ruleId: string;
  severity: Severity;
  scope: FindingScope;
  title: string;
  message: string;
  current?: string | number;
  target?: string | number;
  paragraphIndex?: number;
  field?:
    | "paperSize"
    | "orientation"
    | "marginTop"
    | "marginBottom"
    | "marginLeft"
    | "marginRight"
    | "fontName"
    | "fontSize"
    | "alignment"
    | "firstLineIndent"
    | "spaceBefore"
    | "spaceAfter"
    | "lineSpacing"
    | "sopSection"
    | "capability";
  autoFixable: boolean;
  fix?: FindingFix;
  provenance?: FindingProvenance;
}

export interface DocumentCheckResult {
  profileId: string;
  checkedAt: string;
  score: number;
  findings: Finding[];
  counts: Record<Severity, number>;
}
