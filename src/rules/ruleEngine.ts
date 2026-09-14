import type {
  DocumentCheckResult,
  DocumentRuleProfile,
  DocumentSnapshot,
  Finding,
  FindingScope,
  NumericRule,
  ParagraphRuleSet,
  ParagraphSnapshot,
  Severity
} from "../types";
import { inRange, mmToPoints, pointsToMm } from "../utils/units";
import { classifyParagraph } from "./documentClassifier";
import { validateSopStructure } from "../validators/sopValidator";

const formatRange = (rule: NumericRule) => `${rule.min}-${rule.max} ${rule.unit}`;
const normalize = (value?: string) => (value ?? "").trim().toLocaleLowerCase("vi-VN");

function marginFinding(
  id: string,
  title: string,
  field: Finding["field"],
  currentPt: number | undefined,
  rule: NumericRule
): Finding {
  if (currentPt === undefined) {
    return {
      id,
      ruleId: id,
      severity: "warning",
      scope: "capability",
      title,
      message: "Không đọc được giá trị lề trên phiên bản Word hiện tại.",
      field: "capability",
      autoFixable: false
    };
  }

  const currentMm = pointsToMm(currentPt);
  const ok = inRange(currentMm, rule.min, rule.max, 0.3);
  return {
    id,
    ruleId: id,
    severity: ok ? "passed" : "critical",
    scope: "document",
    title,
    message: ok ? "Đạt quy tắc lề." : `Giá trị hiện tại không nằm trong ${formatRange(rule)}.`,
    current: Number(currentMm.toFixed(1)),
    target: `${rule.preferred} mm`,
    field,
    autoFixable: !ok
  };
}

function numericFinding(
  paragraph: ParagraphSnapshot,
  ruleId: string,
  title: string,
  field: Finding["field"],
  currentPt: number,
  rule: NumericRule,
  severity: Exclude<Severity, "critical" | "passed">,
  scope: FindingScope,
  prefix: string
): Finding {
  const current = rule.unit === "mm" ? pointsToMm(currentPt) : currentPt;
  const tolerance = rule.unit === "mm" ? 0.3 : 0.1;
  const ok = inRange(current, rule.min, rule.max, tolerance);
  const preferredPt = rule.unit === "mm" ? mmToPoints(rule.preferred) : rule.preferred;

  return {
    id: `${prefix}-${paragraph.index}-${field}`,
    ruleId,
    severity: ok ? "passed" : severity,
    scope,
    title: `Đoạn ${paragraph.index + 1}: ${title}`,
    message: ok ? `${title} đạt chuẩn.` : `${title} chưa nằm trong ${formatRange(rule)}.`,
    current: Number(current.toFixed(1)),
    target: rule.preferred,
    paragraphIndex: paragraph.index,
    field,
    autoFixable: !ok,
    fix: !ok
      ? field === "firstLineIndent"
        ? { firstLineIndentPt: preferredPt }
        : field === "spaceBefore"
          ? { spaceBeforePt: preferredPt }
          : field === "spaceAfter"
            ? { spaceAfterPt: preferredPt }
            : field === "lineSpacing"
              ? { lineSpacingPt: preferredPt }
              : undefined
      : undefined
  };
}

function typographyFindings(
  paragraph: ParagraphSnapshot,
  rules: ParagraphRuleSet,
  options: { scope: FindingScope; prefix: "BODY" | "HEADING"; severity: "warning" | "suggestion" }
): Finding[] {
  const findings: Finding[] = [];
  const { scope, prefix, severity } = options;
  const hasReadableFontName = Boolean(paragraph.fontName?.trim());
  const fontOk = hasReadableFontName && normalize(paragraph.fontName) === normalize(rules.fontName);

  findings.push({
    id: `${prefix.toLowerCase()}-${paragraph.index}-fontName`,
    ruleId: `${prefix}-FONT-NAME`,
    severity: fontOk ? "passed" : severity,
    scope,
    title: `Đoạn ${paragraph.index + 1}: Font`,
    message: fontOk
      ? "Font đạt chuẩn."
      : hasReadableFontName
        ? "Font chưa đúng profile."
        : "Đoạn có mixed/unknown font; cần kiểm tra thủ công để bảo toàn định dạng cục bộ.",
    current: paragraph.fontName || "Mixed/Unknown",
    target: rules.fontName,
    paragraphIndex: paragraph.index,
    field: "fontName",
    autoFixable: hasReadableFontName && !fontOk,
    fix: hasReadableFontName && !fontOk ? { fontName: rules.fontName } : undefined
  });

  if (typeof paragraph.fontSize === "number") {
    const sizeOk = inRange(paragraph.fontSize, rules.fontSize.min, rules.fontSize.max, 0.1);
    findings.push({
      id: `${prefix.toLowerCase()}-${paragraph.index}-fontSize`,
      ruleId: `${prefix}-FONT-SIZE`,
      severity: sizeOk ? "passed" : severity,
      scope,
      title: `Đoạn ${paragraph.index + 1}: Cỡ chữ`,
      message: sizeOk ? "Cỡ chữ đạt chuẩn." : `Cỡ chữ chưa nằm trong ${formatRange(rules.fontSize)}.`,
      current: paragraph.fontSize,
      target: rules.fontSize.preferred,
      paragraphIndex: paragraph.index,
      field: "fontSize",
      autoFixable: !sizeOk,
      fix: !sizeOk ? { fontSize: rules.fontSize.preferred } : undefined
    });
  } else {
    findings.push({
      id: `${prefix.toLowerCase()}-${paragraph.index}-fontSize`,
      ruleId: `${prefix}-FONT-SIZE`,
      severity,
      scope,
      title: `Đoạn ${paragraph.index + 1}: Cỡ chữ`,
      message: "Đoạn có mixed/unknown cỡ chữ; cần kiểm tra thủ công để bảo toàn định dạng cục bộ.",
      current: "Mixed/Unknown",
      target: rules.fontSize.preferred,
      paragraphIndex: paragraph.index,
      field: "fontSize",
      autoFixable: false
    });
  }

  if (paragraph.alignment) {
    const alignmentOk = normalize(paragraph.alignment) === normalize(rules.alignment);
    findings.push({
      id: `${prefix.toLowerCase()}-${paragraph.index}-alignment`,
      ruleId: `${prefix}-ALIGNMENT`,
      severity: alignmentOk ? "passed" : prefix === "BODY" ? "suggestion" : severity,
      scope,
      title: `Đoạn ${paragraph.index + 1}: Căn đoạn`,
      message: alignmentOk ? "Căn đoạn đạt chuẩn." : "Căn đoạn khác profile.",
      current: paragraph.alignment,
      target: rules.alignment,
      paragraphIndex: paragraph.index,
      field: "alignment",
      autoFixable: !alignmentOk,
      fix: !alignmentOk ? { alignment: rules.alignment } : undefined
    });
  }

  return findings;
}

function bodyFindings(profile: DocumentRuleProfile, paragraph: ParagraphSnapshot): Finding[] {
  const findings = typographyFindings(paragraph, profile.body, {
    scope: "paragraph",
    prefix: "BODY",
    severity: "warning"
  });

  if (profile.body.firstLineIndentMm && typeof paragraph.firstLineIndentPt === "number") {
    findings.push(
      numericFinding(
        paragraph,
        "BODY-FIRST-LINE-INDENT",
        "Thụt đầu dòng",
        "firstLineIndent",
        paragraph.firstLineIndentPt,
        profile.body.firstLineIndentMm,
        "warning",
        "paragraph",
        "body"
      )
    );
  }
  if (profile.body.spaceBeforePt && typeof paragraph.spaceBeforePt === "number") {
    findings.push(
      numericFinding(
        paragraph,
        "BODY-SPACE-BEFORE",
        "Khoảng cách trước đoạn",
        "spaceBefore",
        paragraph.spaceBeforePt,
        profile.body.spaceBeforePt,
        "suggestion",
        "paragraph",
        "body"
      )
    );
  }
  if (profile.body.spaceAfterPt && typeof paragraph.spaceAfterPt === "number") {
    findings.push(
      numericFinding(
        paragraph,
        "BODY-SPACE-AFTER",
        "Khoảng cách sau đoạn",
        "spaceAfter",
        paragraph.spaceAfterPt,
        profile.body.spaceAfterPt,
        "suggestion",
        "paragraph",
        "body"
      )
    );
  }
  if (profile.body.lineSpacingPt && typeof paragraph.lineSpacingPt === "number") {
    findings.push(
      numericFinding(
        paragraph,
        "BODY-LINE-SPACING",
        "Giãn dòng",
        "lineSpacing",
        paragraph.lineSpacingPt,
        profile.body.lineSpacingPt,
        "suggestion",
        "paragraph",
        "body"
      )
    );
  }
  return findings;
}

function paragraphFindings(profile: DocumentRuleProfile, snapshot: DocumentSnapshot): Finding[] {
  const findings: Finding[] = [];

  snapshot.paragraphs.forEach((paragraph) => {
    if (!paragraph.text.trim()) return;
    const classification = classifyParagraph(paragraph);

    if (classification.role === "body") {
      findings.push(...bodyFindings(profile, paragraph));
      return;
    }

    if (classification.role === "heading" && classification.headingLevel) {
      const headingRules = profile.headings?.[classification.headingLevel];
      if (!headingRules) return;
      findings.push(
        ...typographyFindings(paragraph, headingRules, {
          scope: "section",
          prefix: "HEADING",
          severity: "warning"
        })
      );
    }
  });

  return findings;
}

function calculateScore(findings: Finding[]): number {
  const scorable = findings.filter((finding) => finding.scope !== "capability");
  if (!scorable.length) return 100;

  const penaltyWeight: Record<Exclude<Severity, "passed">, number> = {
    critical: 1,
    warning: 0.6,
    suggestion: 0.25
  };
  const penalty = scorable.reduce((total, finding) => {
    if (finding.severity === "passed") return total;
    return total + penaltyWeight[finding.severity];
  }, 0);
  return Math.max(0, Math.min(100, Math.round(100 * (1 - penalty / scorable.length))));
}

export function evaluateDocument(profile: DocumentRuleProfile, snapshot: DocumentSnapshot): DocumentCheckResult {
  const findings: Finding[] = [];

  if (snapshot.supportsPageSetup && snapshot.pageSetup) {
    const page = snapshot.pageSetup;
    findings.push(
      marginFinding("PAGE-MARGIN-TOP", "Lề trên", "marginTop", page.topMarginPt, profile.page.margins.top),
      marginFinding("PAGE-MARGIN-BOTTOM", "Lề dưới", "marginBottom", page.bottomMarginPt, profile.page.margins.bottom),
      marginFinding("PAGE-MARGIN-LEFT", "Lề trái", "marginLeft", page.leftMarginPt, profile.page.margins.left),
      marginFinding("PAGE-MARGIN-RIGHT", "Lề phải", "marginRight", page.rightMarginPt, profile.page.margins.right)
    );

    const paperOk = normalize(page.paperSize) === normalize(profile.page.paperSize);
    findings.push({
      id: "PAGE-PAPER-SIZE",
      ruleId: "PAGE-PAPER-SIZE",
      severity: paperOk ? "passed" : "critical",
      scope: "document",
      title: "Khổ giấy",
      message: paperOk ? "Khổ giấy đạt chuẩn." : "Khổ giấy khác profile.",
      current: page.paperSize || "Unknown",
      target: profile.page.paperSize,
      field: "paperSize",
      autoFixable: !paperOk
    });

    const orientationOk = normalize(page.orientation) === normalize(profile.page.orientation);
    findings.push({
      id: "PAGE-ORIENTATION",
      ruleId: "PAGE-ORIENTATION",
      severity: orientationOk ? "passed" : "critical",
      scope: "document",
      title: "Hướng giấy",
      message: orientationOk ? "Hướng giấy đạt chuẩn." : "Hướng giấy khác profile.",
      current: page.orientation || "Unknown",
      target: profile.page.orientation,
      field: "orientation",
      autoFixable: !orientationOk
    });
  } else {
    findings.push({
      id: "CAPABILITY-PAGE-SETUP",
      ruleId: "CAPABILITY-PAGE-SETUP",
      severity: "warning",
      scope: "capability",
      title: "Page Setup API",
      message: "Word hiện tại không hỗ trợ Page Setup API cần thiết; không thể kiểm tra/căn lề tự động.",
      field: "capability",
      autoFixable: false
    });
  }

  findings.push(...paragraphFindings(profile, snapshot));
  findings.push(...validateSopStructure(profile, snapshot.paragraphs));

  const counts: Record<Severity, number> = {
    critical: findings.filter((f) => f.severity === "critical").length,
    warning: findings.filter((f) => f.severity === "warning").length,
    suggestion: findings.filter((f) => f.severity === "suggestion").length,
    passed: findings.filter((f) => f.severity === "passed").length
  };

  return {
    profileId: profile.id,
    checkedAt: new Date().toISOString(),
    score: calculateScore(findings),
    findings,
    counts
  };
}
