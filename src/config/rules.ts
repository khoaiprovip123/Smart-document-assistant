import type { DocumentRuleProfile, HeadingLevel, ParagraphRuleSet } from "../types";

const mm = (min: number, max: number, preferred: number) => ({ min, max, preferred, unit: "mm" as const });
const pt = (min: number, max: number, preferred: number) => ({ min, max, preferred, unit: "pt" as const });

const headingRule = (size: number): ParagraphRuleSet => ({
  fontName: "Times New Roman",
  fontSize: pt(size, size, size),
  alignment: "Left",
  firstLineIndentMm: mm(0, 0, 0),
  spaceBeforePt: pt(0, 12, 6),
  spaceAfterPt: pt(0, 6, 3),
  bold: true
});

const defaultHeadings: Record<HeadingLevel, ParagraphRuleSet> = {
  1: headingRule(14),
  2: headingRule(14),
  3: headingRule(13),
  4: headingRule(13)
};

const standardPage = {
  paperSize: "A4" as const,
  orientation: "Portrait" as const,
  margins: {
    top: mm(20, 25, 20),
    bottom: mm(20, 25, 20),
    left: mm(30, 35, 30),
    right: mm(15, 20, 20)
  }
};

const standardBody: ParagraphRuleSet = {
  fontName: "Times New Roman",
  fontSize: pt(13, 14, 13),
  alignment: "Justified",
  firstLineIndentMm: mm(10, 12.7, 10)
};

export const RULE_PROFILES: DocumentRuleProfile[] = [
  {
    id: "HPC-ND30",
    name: "Nghị định 30/2020/NĐ-CP",
    version: "1.1.0",
    status: "approved",
    description:
      "Profile kiểm tra các quy tắc ND30 đã được engine hỗ trợ: A4, lề, typography thân bài và convention heading HPC. Không tuyên bố full legal compliance.",
    source: "Nghị định 30/2020/NĐ-CP - Phụ lục I",
    page: standardPage,
    body: standardBody,
    headings: defaultHeadings
  },
  {
    id: "HPC-INTERNAL",
    name: "HPC Văn bản nội bộ",
    version: "0.2.0",
    status: "draft",
    description: "DRAFT - profile nội bộ kế thừa baseline hành chính và HPC Styles; cần HPC phê duyệt trước production.",
    page: standardPage,
    body: standardBody,
    headings: defaultHeadings
  },
  {
    id: "HPC-SOP",
    name: "HPC SOP",
    version: "0.2.0",
    status: "draft",
    description: "DRAFT - kiểm tra typography, heading và cấu trúc SOP; cần HPC phê duyệt danh mục section trước production.",
    page: standardPage,
    body: standardBody,
    headings: defaultHeadings,
    sopRequiredSections: [
      "Mục đích",
      "Phạm vi",
      "Thuật ngữ",
      "Trách nhiệm",
      "Quy trình",
      "Kiểm soát",
      "Biểu mẫu",
      "Ngoại lệ",
      "Báo cáo",
      "Lịch sử sửa đổi"
    ]
  }
];

export const getProfile = (id: string): DocumentRuleProfile => {
  const profile = RULE_PROFILES.find((item) => item.id === id);
  if (!profile) throw new Error(`Không tìm thấy rule profile: ${id}`);
  return profile;
};
