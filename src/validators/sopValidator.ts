import type { DocumentRuleProfile, Finding, ParagraphSnapshot } from "../types";

const normalize = (value: string): string =>
  value
    .toLocaleLowerCase("vi-VN")
    .replace(/^\s*\d+(?:\.\d+)*[.)-]?\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

export function validateSopStructure(profile: DocumentRuleProfile, paragraphs: ParagraphSnapshot[]): Finding[] {
  if (!profile.sopRequiredSections?.length) return [];

  const normalizedParagraphs = paragraphs
    .map((paragraph) => ({ index: paragraph.index, text: normalize(paragraph.text) }))
    .filter((item) => Boolean(item.text));

  const findings: Finding[] = [];
  const firstPositions: number[] = [];
  const duplicateSections: string[] = [];

  profile.sopRequiredSections.forEach((section, idx) => {
    const expected = normalize(section);
    const matches = normalizedParagraphs.filter(
      (item) => item.text === expected || item.text.startsWith(`${expected}:`)
    );
    const exists = matches.length > 0;
    if (exists) firstPositions.push(matches[0].index);
    if (matches.length > 1) duplicateSections.push(section);

    findings.push({
      id: `sop-section-${idx}`,
      ruleId: `SOP-SECTION-${idx + 1}`,
      severity: exists ? "passed" : "warning",
      scope: "structure",
      title: exists ? `Có mục: ${section}` : `Thiếu mục: ${section}`,
      message: exists ? "Đã phát hiện section bắt buộc." : "Tài liệu SOP chưa có section bắt buộc này.",
      target: section,
      field: "sopSection",
      autoFixable: false
    });
  });

  if (duplicateSections.length > 0) {
    findings.push({
      id: "sop-duplicate-section",
      ruleId: "SOP-DUPLICATE-SECTION",
      severity: "warning",
      scope: "structure",
      title: "Section SOP bị lặp",
      message: `Các section xuất hiện nhiều lần: ${duplicateSections.join(", ")}.`,
      current: duplicateSections.join(", "),
      autoFixable: false
    });
  }

  const ordered = firstPositions.every((position, index) => index === 0 || firstPositions[index - 1] < position);
  if (!ordered) {
    findings.push({
      id: "sop-section-order",
      ruleId: "SOP-SECTION-ORDER",
      severity: "warning",
      scope: "structure",
      title: "Thứ tự section SOP chưa đúng",
      message: "Các section đã có nhưng không theo thứ tự cấu hình của profile.",
      autoFixable: false
    });
  }

  return findings;
}
