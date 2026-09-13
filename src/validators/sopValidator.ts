import type { DocumentRuleProfile, Finding, ParagraphSnapshot } from "../types";

const normalize = (value: string): string =>
  value
    .toLocaleLowerCase("vi-VN")
    .replace(/^\s*\d+(?:\.\d+)*[.)-]?\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

export function validateSopStructure(profile: DocumentRuleProfile, paragraphs: ParagraphSnapshot[]): Finding[] {
  if (!profile.sopRequiredSections?.length) return [];
  const text = paragraphs.map((p) => normalize(p.text)).filter(Boolean);

  return profile.sopRequiredSections.map((section, idx) => {
    const expected = normalize(section);
    const exists = text.some((line) => line === expected || line.startsWith(`${expected}:`));
    return {
      id: `sop-section-${idx}`,
      ruleId: `SOP-SECTION-${idx + 1}`,
      severity: exists ? "passed" : "warning",
      scope: "structure",
      title: exists ? `Có mục: ${section}` : `Thiếu mục: ${section}`,
      message: exists ? "Đã phát hiện section bắt buộc." : "Tài liệu SOP chưa có section bắt buộc này.",
      target: section,
      field: "sopSection",
      autoFixable: false
    } satisfies Finding;
  });
}
