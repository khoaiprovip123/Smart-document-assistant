import { describe, expect, it } from "vitest";
import { classifyDocumentFamily } from "../../word/profileClassifier";
import { createSemanticDocumentSnapshot } from "../../word/documentModel";
import type { WordCapabilityMatrix } from "../../word/capabilities";

const capabilities: WordCapabilityMatrix = {
  wordApi11: true, lists: true, commentsFields: false, styles15: false,
  trackedChanges: false, uniqueParagraphIds: false, pageSetupDesktop: false,
  tocDesktop: false, ooxml: true, inlinePictures: true
};

function snapshot(lines: string[]) {
  return createSemanticDocumentSnapshot({
    capabilities,
    sections: [], tables: [], fields: [], inlinePictures: [], comments: [], trackedChanges: [],
    paragraphs: lines.map((text, index) => ({ index, text }))
  });
}

describe("document family classifier", () => {
  it("ranks an academic thesis above generic families", () => {
    const result = classifyDocumentFamily(snapshot([
      "LUẬN VĂN THẠC SĨ",
      "TÓM TẮT",
      "CHƯƠNG 1. TỔNG QUAN",
      "TÀI LIỆU THAM KHẢO"
    ]));
    expect(result.selected).toBe("academic");
    expect(result.candidates[0].family).toBe("academic");
    expect(result.selectedScore).toBeGreaterThanOrEqual(0.7);
    expect(result.requiresConfirmation).toBe(false);
  });

  it("recognizes Vietnamese administrative evidence", () => {
    const result = classifyDocumentFamily(snapshot([
      "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
      "Độc lập - Tự do - Hạnh phúc",
      "Số: 12/TTr-ABC",
      "Nơi nhận:"
    ]));
    expect(result.selected).toBe("administrative");
  });

  it("recognizes SOP structure", () => {
    const result = classifyDocumentFamily(snapshot([
      "MỤC ĐÍCH", "PHẠM VI", "TRÁCH NHIỆM", "QUY TRÌNH", "LỊCH SỬ SỬA ĐỔI"
    ]));
    expect(result.selected).toBe("sop");
  });

  it("requires confirmation when evidence is weak", () => {
    const result = classifyDocumentFamily(snapshot(["Tài liệu thử nghiệm"]));
    expect(result.selected).toBe("unknown");
    expect(result.requiresConfirmation).toBe(true);
  });

  it("uses deterministic family ordering for ties", () => {
    const result = classifyDocumentFamily(snapshot(["ABSTRACT", "REFERENCES"]), 0.9);
    const families = result.candidates.map((item) => item.family);
    expect(families).toEqual([...families].sort((a, b) => {
      const sa = result.candidates.find((x) => x.family === a)?.score ?? 0;
      const sb = result.candidates.find((x) => x.family === b)?.score ?? 0;
      return sb - sa || a.localeCompare(b);
    }));
  });
});
