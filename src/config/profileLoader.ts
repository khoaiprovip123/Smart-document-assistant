import type { DocumentRuleProfile, NumericRule, ParagraphRuleSet } from "../types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validNumericRule(value: unknown): value is NumericRule {
  if (!isObject(value)) return false;
  return (
    typeof value.min === "number" &&
    typeof value.max === "number" &&
    typeof value.preferred === "number" &&
    (value.unit === "mm" || value.unit === "pt") &&
    value.min <= value.preferred &&
    value.preferred <= value.max
  );
}

function validParagraphRule(value: unknown): value is ParagraphRuleSet {
  if (!isObject(value)) return false;
  return (
    typeof value.fontName === "string" &&
    value.fontName.trim().length > 0 &&
    validNumericRule(value.fontSize) &&
    ["Left", "Centered", "Right", "Justified"].includes(String(value.alignment)) &&
    (value.firstLineIndentMm === undefined || validNumericRule(value.firstLineIndentMm)) &&
    (value.spaceBeforePt === undefined || validNumericRule(value.spaceBeforePt)) &&
    (value.spaceAfterPt === undefined || validNumericRule(value.spaceAfterPt)) &&
    (value.lineSpacingPt === undefined || validNumericRule(value.lineSpacingPt))
  );
}

function validProfile(value: unknown): value is DocumentRuleProfile {
  if (!isObject(value) || !isObject(value.page) || !isObject(value.page.margins)) return false;
  const margins = value.page.margins;
  return (
    typeof value.id === "string" && value.id.trim().length > 0 &&
    typeof value.name === "string" && value.name.trim().length > 0 &&
    typeof value.version === "string" && value.version.trim().length > 0 &&
    (value.status === "draft" || value.status === "approved") &&
    typeof value.description === "string" &&
    value.page.paperSize === "A4" &&
    (value.page.orientation === "Portrait" || value.page.orientation === "Landscape") &&
    validNumericRule(margins.top) &&
    validNumericRule(margins.bottom) &&
    validNumericRule(margins.left) &&
    validNumericRule(margins.right) &&
    validParagraphRule(value.body)
  );
}

export function parseRuleProfiles(json: string): DocumentRuleProfile[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("JSON rule profile không hợp lệ.");
  }

  if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.every(validProfile)) {
    throw new Error("Cấu trúc rule profile không hợp lệ.");
  }

  const ids = parsed.map((profile) => profile.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Rule profile có ID trùng nhau.");
  }

  return structuredClone(parsed);
}
