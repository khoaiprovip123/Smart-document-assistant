import type { HeadingLevel, ParagraphRole, ParagraphRoleInfo, ParagraphSnapshot } from "../types";

const normalizeStyle = (style?: string) => (style ?? "").trim().toLocaleLowerCase("en-US");

const semanticStyleMap: Record<string, ParagraphRole> = {
  "hpc.normal": "body",
  "hpc.title": "title",
  "hpc.subtitle": "subtitle",
  "hpc.tableheader": "tableText",
  "hpc.caption": "caption",
  "caption": "caption",
  "hpc.note": "note",
  "hpc.signature": "signature",
  "hpc.recipient": "recipient",
  "hpc.appendix": "appendix"
};

function explicitHeadingLevel(style?: string): HeadingLevel | undefined {
  const match = normalizeStyle(style).match(/^(?:heading\s*|hpc\.heading)([1-4])$/i);
  if (!match) return undefined;
  return Number(match[1]) as HeadingLevel;
}

export function classifyParagraph(paragraph: ParagraphSnapshot): ParagraphRoleInfo {
  if (paragraph.role) {
    return {
      role: paragraph.role,
      confidence: "explicit",
      headingLevel: paragraph.headingLevel,
      listLevel: paragraph.listLevel
    };
  }

  const headingLevel = explicitHeadingLevel(paragraph.style);
  if (headingLevel) {
    return { role: "heading", headingLevel, confidence: "explicit" };
  }

  const semanticRole = semanticStyleMap[normalizeStyle(paragraph.style)];
  if (semanticRole) {
    return { role: semanticRole, confidence: "explicit" };
  }

  if (typeof paragraph.listLevel === "number" || Boolean(paragraph.listString?.trim())) {
    return {
      role: "list",
      listLevel: paragraph.listLevel ?? 0,
      confidence: "metadata"
    };
  }

  const style = normalizeStyle(paragraph.style);
  if (style.includes("list")) return { role: "list", confidence: "heuristic" };
  if (style.includes("title")) return { role: "title", confidence: "heuristic" };
  if (style.includes("subtitle")) return { role: "subtitle", confidence: "heuristic" };

  return { role: "body", confidence: "fallback" };
}
