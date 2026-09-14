import type { ParagraphSnapshotV2, SemanticRoleInfoV2 } from "./documentModel";

const normalizedStyle = (style?: string) => (style ?? "").trim().toLocaleLowerCase("en-US");
const normalizedText = (text: string) => text.trim().replace(/\s+/g, " ").toLocaleUpperCase("vi-VN");

function headingFromStyle(style?: string): SemanticRoleInfoV2 | undefined {
  const raw = (style ?? "").trim();
  const match = normalizedStyle(style).match(/^(?:heading\s*|hpc\.heading)([1-9])$/i);
  if (!match) return undefined;
  return {
    role: "heading",
    headingLevel: Number(match[1]) as SemanticRoleInfoV2["headingLevel"],
    confidence: 1,
    evidence: [`style:${raw}`]
  };
}

const styleRoles: Record<string, SemanticRoleInfoV2["role"]> = {
  "hpc.title": "title",
  title: "title",
  "hpc.subtitle": "subtitle",
  subtitle: "subtitle",
  "hpc.caption": "caption",
  caption: "caption",
  "hpc.signature": "signature",
  "hpc.recipient": "recipient",
  "hpc.note": "note",
  "hpc.appendix": "appendix",
  "hpc.table": "tableText",
  "hpc.tableheader": "tableText"
};

export function classifySemanticParagraph(paragraph: ParagraphSnapshotV2): SemanticRoleInfoV2 {
  const heading = headingFromStyle(paragraph.style);
  if (heading) return heading;

  const style = normalizedStyle(paragraph.style);
  const styleRole = styleRoles[style];
  if (styleRole) {
    return { role: styleRole, confidence: 1, evidence: [`style:${paragraph.style}`] };
  }

  if (paragraph.inTable) {
    return { role: "tableText", confidence: 0.95, evidence: ["metadata:in-table"] };
  }

  if (typeof paragraph.listLevel === "number" || Boolean(paragraph.listString?.trim())) {
    return { role: "list", confidence: 0.95, evidence: ["metadata:list"] };
  }

  const text = normalizedText(paragraph.text);
  if (/^(TÀI LIỆU THAM KHẢO|REFERENCES|BIBLIOGRAPHY)\b/.test(text)) {
    return { role: "references", confidence: 0.95, evidence: ["text-marker:references"] };
  }
  if (/^(PHỤ LỤC|APPENDIX)\b/.test(text)) {
    return { role: "appendix", confidence: 0.95, evidence: ["text-marker:appendix"] };
  }
  if (/^NƠI NHẬN\s*:/.test(text)) {
    return { role: "recipient", confidence: 0.95, evidence: ["text-marker:recipient"] };
  }

  if (style.includes("quote")) return { role: "quote", confidence: 0.7, evidence: [`style-heuristic:${paragraph.style}`] };
  if (style.includes("list")) return { role: "list", confidence: 0.7, evidence: [`style-heuristic:${paragraph.style}`] };

  return { role: "body", confidence: 0.35, evidence: ["fallback:body"] };
}

export function classifySemanticParagraphs(paragraphs: readonly ParagraphSnapshotV2[]): ParagraphSnapshotV2[] {
  return paragraphs.map((paragraph) => ({
    ...paragraph,
    semantic: classifySemanticParagraph(paragraph)
  }));
}
