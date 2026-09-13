import type { DocumentCheckResult, DocumentRuleProfile, DocumentSnapshot, Finding, NumericRule, Severity } from "../types";
import { inRange, pointsToMm } from "../utils/units";
import { validateSopStructure } from "../validators/sopValidator";

const formatRange = (rule: NumericRule) => `${rule.min}-${rule.max} ${rule.unit}`;
const normalize = (value?: string) => (value ?? "").trim().toLocaleLowerCase("vi-VN");
const isHeadingStyle = (style?: string) => /^(?:heading\s*[1-9]|hpc\.heading[1-4])$/i.test((style ?? "").trim());

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
      scope: "document",
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

function paragraphNumericFinding(
  paragraphIndex: number,
  ruleId: string,
  title: string,
  field: Finding["field"],
  currentPt: number,
  rule: NumericRule,
  severity: Exclude<Severity, "critical" | "passed">
): Finding {
  const current = rule.unit === "mm" ? pointsToMm(currentPt) : currentPt;
  const tolerance = rule.unit === "mm" ? 0.3 : 0.1;
  const ok = inRange(current, rule.min, rule.max, tolerance);

  return {
    id: `p-${paragraphIndex}-${field}`,
    ruleId,
    severity: ok ? "passed" : severity,
    scope: "paragraph",
    title: `Đoạn ${paragraphIndex + 1}: ${title}`,
    message: ok ? `${title} đạt chuẩn.` : `${title} chưa nằm trong ${formatRange(rule)}.`,
    current: Number(current.toFixed(1)),
    target: rule.preferred,
    paragraphIndex,
    field,
    autoFixable: !ok
  };
}

function paragraphFindings(profile: DocumentRuleProfile, snapshot: DocumentSnapshot): Finding[] {
  const findings: Finding[] = [];

  snapshot.paragraphs.forEach((paragraph) => {
    if (!paragraph.text.trim()) return;
    if (isHeadingStyle(paragraph.style)) return;

    const fontOk = normalize(paragraph.fontName) === normalize(profile.body.fontName);
    findings.push({
      id: `p-${paragraph.index}-fontName`,
      ruleId: "BODY-FONT-NAME",
      severity: fontOk ? "passed" : "warning",
      scope: "paragraph",
      title: `Đoạn ${paragraph.index + 1}: Font`,
      message: fontOk ? "Font đạt chuẩn." : "Font thân bài chưa đúng profile.",
      current: paragraph.fontName || "Mixed/Unknown",
      target: profile.body.fontName,
      paragraphIndex: paragraph.index,
      field: "fontName",
      autoFixable: !fontOk
    });

    if (typeof paragraph.fontSize === "number") {
      const sizeOk = inRange(paragraph.fontSize, profile.body.fontSize.min, profile.body.fontSize.max, 0.1);
      findings.push({
        id: `p-${paragraph.index}-fontSize`,
        ruleId: "BODY-FONT-SIZE",
        severity: sizeOk ? "passed" : "warning",
        scope: "paragraph",
        title: `Đoạn ${paragraph.index + 1}: Cỡ chữ`,
        message: sizeOk ? "Cỡ chữ đạt chuẩn." : `Cỡ chữ chưa nằm trong ${formatRange(profile.body.fontSize)}.`,
        current: paragraph.fontSize,
        target: profile.body.fontSize.preferred,
        paragraphIndex: paragraph.index,
        field: "fontSize",
        autoFixable: !sizeOk
      });
    }

    if (paragraph.alignment) {
      const alignmentOk = normalize(paragraph.alignment) === normalize(profile.body.alignment);
      findings.push({
        id: `p-${paragraph.index}-alignment`,
        ruleId: "BODY-ALIGNMENT",
        severity: alignmentOk ? "passed" : "suggestion",
        scope: "paragraph",
        title: `Đoạn ${paragraph.index + 1}: Căn đoạn`,
        message: alignmentOk ? "Căn đoạn đạt chuẩn." : "Căn đoạn khác profile.",
        current: paragraph.alignment,
        target: profile.body.alignment,
        paragraphIndex: paragraph.index,
        field: "alignment",
        autoFixable: !alignmentOk
      });
    }

    if (profile.body.firstLineIndentMm && typeof paragraph.firstLineIndentPt === "number") {
      findings.push(
        paragraphNumericFinding(
          paragraph.index,
          "BODY-FIRST-LINE-INDENT",
          "Thụt đầu dòng",
          "firstLineIndent",
          paragraph.firstLineIndentPt,
          profile.body.firstLineIndentMm,
          "warning"
        )
      );
    }

    if (profile.body.spaceBeforePt && typeof paragraph.spaceBeforePt === "number") {
      findings.push(
        paragraphNumericFinding(
          paragraph.index,
          "BODY-SPACE-BEFORE",
          "Khoảng cách trước đoạn",
          "spaceBefore",
          paragraph.spaceBeforePt,
          profile.body.spaceBeforePt,
          "suggestion"
        )
      );
    }

    if (profile.body.spaceAfterPt && typeof paragraph.spaceAfterPt === "number") {
      findings.push(
        paragraphNumericFinding(
          paragraph.index,
          "BODY-SPACE-AFTER",
          "Khoảng cách sau đoạn",
          "spaceAfter",
          paragraph.spaceAfterPt,
          profile.body.spaceAfterPt,
          "suggestion"
        )
      );
    }

    if (profile.body.lineSpacingPt && typeof paragraph.lineSpacingPt === "number") {
      findings.push(
        paragraphNumericFinding(
          paragraph.index,
          "BODY-LINE-SPACING",
          "Giãn dòng",
          "lineSpacing",
          paragraph.lineSpacingPt,
          profile.body.lineSpacingPt,
          "suggestion"
        )
      );
    }
  });

  return findings;
}

function calculateScore(findings: Finding[]): number {
  const relevant = findings.filter((f) => f.severity !== "passed");
  if (!relevant.length) return 100;
  const penalties: Record<Exclude<Severity, "passed">, number> = {
    critical: 12,
    warning: 5,
    suggestion: 2
  };
  const penalty = relevant.reduce((total, finding) => total + penalties[finding.severity as Exclude<Severity, "passed">], 0);
  return Math.max(0, Math.round(100 - penalty));
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
