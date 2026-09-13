export type Severity = "critical" | "warning" | "suggestion" | "passed";
export type FindingScope = "document" | "section" | "paragraph" | "structure" | "capability";

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
}

export interface DocumentCheckResult {
  profileId: string;
  checkedAt: string;
  score: number;
  findings: Finding[];
  counts: Record<Severity, number>;
}
