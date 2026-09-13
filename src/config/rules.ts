import type { DocumentRuleProfile } from "../types";

const mm = (min: number, max: number, preferred: number) => ({ min, max, preferred, unit: "mm" as const });
const pt = (min: number, max: number, preferred: number) => ({ min, max, preferred, unit: "pt" as const });

export const RULE_PROFILES: DocumentRuleProfile[] = [
  {
    id: "HPC-ND30",
    name: "Nghị định 30/2020/NĐ-CP",
    version: "1.0.0",
    status: "approved",
    description: "Profile thể thức văn bản hành chính. MVP chỉ tự động hóa các quy tắc đã được xác minh trong code.",
    source: "Nghị định 30/2020/NĐ-CP - Phụ lục I",
    page: {
      paperSize: "A4",
      orientation: "Portrait",
      margins: {
        top: mm(20, 25, 20),
        bottom: mm(20, 25, 20),
        left: mm(30, 35, 30),
        right: mm(15, 20, 20)
      }
    },
    body: {
      fontName: "Times New Roman",
      fontSize: pt(13, 14, 13),
      alignment: "Justified",
      firstLineIndentMm: mm(10, 12.7, 10)
    }
  },
  {
    id: "HPC-INTERNAL",
    name: "HPC Văn bản nội bộ",
    version: "0.1.0",
    status: "draft",
    description: "Giả định - cần xác nhận: profile nội bộ khởi tạo từ chuẩn văn bản hành chính để chạy MVP.",
    page: {
      paperSize: "A4",
      orientation: "Portrait",
      margins: {
        top: mm(20, 25, 20),
        bottom: mm(20, 25, 20),
        left: mm(30, 35, 30),
        right: mm(15, 20, 20)
      }
    },
    body: {
      fontName: "Times New Roman",
      fontSize: pt(13, 14, 13),
      alignment: "Justified",
      firstLineIndentMm: mm(10, 12.7, 10)
    }
  },
  {
    id: "HPC-SOP",
    name: "HPC SOP",
    version: "0.1.0",
    status: "draft",
    description: "Giả định - cần xác nhận: bộ khung SOP nội bộ cho MVP.",
    page: {
      paperSize: "A4",
      orientation: "Portrait",
      margins: {
        top: mm(20, 25, 20),
        bottom: mm(20, 25, 20),
        left: mm(30, 35, 30),
        right: mm(15, 20, 20)
      }
    },
    body: {
      fontName: "Times New Roman",
      fontSize: pt(13, 14, 13),
      alignment: "Justified",
      firstLineIndentMm: mm(10, 12.7, 10)
    },
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
