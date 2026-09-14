import type { SemanticDocumentSnapshot } from "./documentModel";

export type DocumentFamily =
  | "administrative"
  | "academic"
  | "scientific"
  | "publishing"
  | "corporate"
  | "sop"
  | "unknown";

export interface DocumentFamilyCandidate {
  family: Exclude<DocumentFamily, "unknown">;
  score: number;
  evidence: readonly string[];
}

export interface DocumentFamilyClassification {
  candidates: readonly DocumentFamilyCandidate[];
  selected: DocumentFamily;
  selectedScore: number;
  requiresConfirmation: boolean;
}

type Signal = { pattern: RegExp; weight: number; evidence: string };

const signals: Record<Exclude<DocumentFamily, "unknown">, readonly Signal[]> = {
  administrative: [
    { pattern: /CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM/i, weight: 0.45, evidence: "national-header" },
    { pattern: /ĐỘC LẬP\s*[-–—]\s*TỰ DO\s*[-–—]\s*HẠNH PHÚC/i, weight: 0.2, evidence: "motto" },
    { pattern: /(?:^|\n)\s*SỐ\s*:/i, weight: 0.15, evidence: "document-number" },
    { pattern: /NƠI NHẬN\s*:/i, weight: 0.2, evidence: "recipient-block" }
  ],
  academic: [
    { pattern: /LUẬN VĂN|LUẬN ÁN|THESIS|DISSERTATION/i, weight: 0.45, evidence: "thesis-marker" },
    { pattern: /TÓM TẮT|ABSTRACT/i, weight: 0.15, evidence: "abstract" },
    { pattern: /CHƯƠNG\s+\d|CHAPTER\s+\d/i, weight: 0.15, evidence: "chapter" },
    { pattern: /TÀI LIỆU THAM KHẢO|REFERENCES/i, weight: 0.25, evidence: "references" }
  ],
  scientific: [
    { pattern: /\bABSTRACT\b|\bTÓM TẮT\b/i, weight: 0.25, evidence: "abstract" },
    { pattern: /\bKEYWORDS?\b|TỪ KHÓA/i, weight: 0.2, evidence: "keywords" },
    { pattern: /\bREFERENCES\b|TÀI LIỆU THAM KHẢO/i, weight: 0.2, evidence: "references" },
    { pattern: /\bDOI\b|DOI\.ORG/i, weight: 0.2, evidence: "doi" },
    { pattern: /CORRESPONDING AUTHOR|AFFILIATION|ORCID/i, weight: 0.15, evidence: "author-metadata" }
  ],
  publishing: [
    { pattern: /ISBN/i, weight: 0.35, evidence: "isbn" },
    { pattern: /MỤC LỤC|CONTENTS/i, weight: 0.15, evidence: "contents" },
    { pattern: /LỜI NÓI ĐẦU|PREFACE|FOREWORD/i, weight: 0.25, evidence: "front-matter" },
    { pattern: /INDEX|CHỈ MỤC/i, weight: 0.25, evidence: "index" }
  ],
  corporate: [
    { pattern: /BÁO CÁO|REPORT/i, weight: 0.25, evidence: "report" },
    { pattern: /ĐỀ XUẤT|PROPOSAL/i, weight: 0.25, evidence: "proposal" },
    { pattern: /BIÊN BẢN HỌP|MEETING MINUTES/i, weight: 0.3, evidence: "minutes" },
    { pattern: /MEMO|THÔNG BÁO NỘI BỘ/i, weight: 0.2, evidence: "memo" }
  ],
  sop: [
    { pattern: /MỤC ĐÍCH|PURPOSE/i, weight: 0.2, evidence: "purpose" },
    { pattern: /PHẠM VI|SCOPE/i, weight: 0.2, evidence: "scope" },
    { pattern: /TRÁCH NHIỆM|RESPONSIBILIT(?:Y|IES)/i, weight: 0.2, evidence: "responsibilities" },
    { pattern: /QUY TRÌNH|PROCEDURE/i, weight: 0.2, evidence: "procedure" },
    { pattern: /LỊCH SỬ SỬA ĐỔI|REVISION HISTORY/i, weight: 0.2, evidence: "revision-history" }
  ]
};

function documentText(snapshot: SemanticDocumentSnapshot): string {
  return snapshot.paragraphs.map((paragraph) => paragraph.text).join("\n");
}

export function classifyDocumentFamily(
  snapshot: SemanticDocumentSnapshot,
  confirmationThreshold = 0.7
): DocumentFamilyClassification {
  const text = documentText(snapshot);
  const candidates: DocumentFamilyCandidate[] = [];

  for (const [family, familySignals] of Object.entries(signals) as [Exclude<DocumentFamily, "unknown">, readonly Signal[]][]) {
    let score = 0;
    const evidence: string[] = [];
    for (const signal of familySignals) {
      if (signal.pattern.test(text)) {
        score += signal.weight;
        evidence.push(signal.evidence);
      }
    }
    if (score > 0) {
      candidates.push({ family, score: Math.min(1, Number(score.toFixed(4))), evidence: Object.freeze(evidence) });
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.family.localeCompare(b.family));
  const top = candidates[0];
  if (!top) {
    return { candidates: Object.freeze([]), selected: "unknown", selectedScore: 0, requiresConfirmation: true };
  }

  return {
    candidates: Object.freeze(candidates.map((candidate) => Object.freeze({ ...candidate }))),
    selected: top.family,
    selectedScore: top.score,
    requiresConfirmation: top.score < confirmationThreshold
  };
}
