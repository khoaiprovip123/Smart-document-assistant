import type { SemanticDocumentSnapshot, SemanticRole } from "../word/documentModel";

export interface TemplateEvidence {
  id: string;
  kind: "page-setup" | "body-typography" | "heading-pattern" | "numbering" | "caption" | "header-footer" | "style";
  observed: unknown;
  occurrences: number;
  confidence: number;
  samples: readonly string[];
}

export interface TemplateHeadingPattern {
  level: number;
  style?: string;
  count: number;
  numberingExamples: readonly string[];
}

export interface TemplateHeaderFooterEvidence {
  sectionIndex: number;
  headerText?: string;
  footerText?: string;
}

export interface TemplateStyleObservation {
  style: string;
  count: number;
  roles: readonly SemanticRole[];
}

export interface TrustedTemplateAnalysis {
  sectionCount: number;
  dominantBodyFont?: string;
  dominantBodySizePt?: number;
  dominantBodyAlignment?: string;
  pageSetups: readonly Readonly<Record<string, unknown>>[];
  styles: readonly TemplateStyleObservation[];
  headingPatterns: readonly TemplateHeadingPattern[];
  numberingExamples: readonly string[];
  captionStyles: readonly string[];
  headerFooterEvidence: readonly TemplateHeaderFooterEvidence[];
  confidence: number;
  evidence: readonly TemplateEvidence[];
}

function normalizeText(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function dominant<T extends string | number>(values: readonly T[]): { value?: T; count: number; confidence: number } {
  if (values.length === 0) return { count: 0, confidence: 0 };
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
  const [value, count] = sorted[0];
  return { value, count, confidence: count / values.length };
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.map((value) => value.trim()).filter(Boolean))].sort());
}

function average(values: readonly number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function analyzeTrustedTemplate(document: SemanticDocumentSnapshot): TrustedTemplateAnalysis {
  const evidence: TemplateEvidence[] = [];
  const bodyParagraphs = document.paragraphs.filter((paragraph) => paragraph.semantic?.role === "body");
  const bodyFonts = bodyParagraphs.map((paragraph) => paragraph.fontName).filter((value): value is string => Boolean(value));
  const bodySizes = bodyParagraphs.map((paragraph) => paragraph.fontSize).filter((value): value is number => typeof value === "number");
  const bodyAlignments = bodyParagraphs.map((paragraph) => paragraph.alignment).filter((value): value is string => Boolean(value));

  const bodyFont = dominant(bodyFonts);
  const bodySize = dominant(bodySizes);
  const bodyAlignment = dominant(bodyAlignments);

  if (bodyFont.value !== undefined) {
    evidence.push(Object.freeze({
      id: "body-font",
      kind: "body-typography" as const,
      observed: bodyFont.value,
      occurrences: bodyFont.count,
      confidence: bodyFont.confidence,
      samples: Object.freeze(bodyParagraphs.filter((item) => item.fontName === bodyFont.value).slice(0, 3).map((item) => item.text))
    }));
  }
  if (bodySize.value !== undefined) {
    evidence.push(Object.freeze({
      id: "body-size",
      kind: "body-typography" as const,
      observed: bodySize.value,
      occurrences: bodySize.count,
      confidence: bodySize.confidence,
      samples: Object.freeze(bodyParagraphs.filter((item) => item.fontSize === bodySize.value).slice(0, 3).map((item) => item.text))
    }));
  }
  if (bodyAlignment.value !== undefined) {
    evidence.push(Object.freeze({
      id: "body-alignment",
      kind: "body-typography" as const,
      observed: bodyAlignment.value,
      occurrences: bodyAlignment.count,
      confidence: bodyAlignment.confidence,
      samples: Object.freeze(bodyParagraphs.filter((item) => item.alignment === bodyAlignment.value).slice(0, 3).map((item) => item.text))
    }));
  }

  const pageSetups = document.sections
    .filter((section) => Boolean(section.pageSetup))
    .map((section) => Object.freeze({ sectionIndex: section.index, ...section.pageSetup }));
  for (const setup of pageSetups) {
    evidence.push(Object.freeze({
      id: `page-setup-${String(setup.sectionIndex)}`,
      kind: "page-setup" as const,
      observed: setup,
      occurrences: 1,
      confidence: 1,
      samples: Object.freeze([`section:${String(setup.sectionIndex)}`])
    }));
  }

  const headingMap = new Map<string, { level: number; style?: string; count: number; numbering: string[]; samples: string[] }>();
  for (const paragraph of document.paragraphs) {
    if (paragraph.semantic?.role !== "heading" || !paragraph.semantic.headingLevel) continue;
    const level = paragraph.semantic.headingLevel;
    const key = `${level}:${paragraph.style ?? ""}`;
    const current = headingMap.get(key) ?? { level, style: normalizeText(paragraph.style), count: 0, numbering: [], samples: [] };
    current.count += 1;
    if (paragraph.listString?.trim()) current.numbering.push(paragraph.listString.trim());
    current.samples.push(paragraph.text);
    headingMap.set(key, current);
  }

  const headingPatterns = Object.freeze([...headingMap.values()]
    .sort((a, b) => a.level - b.level || (a.style ?? "").localeCompare(b.style ?? ""))
    .map((item) => {
      const numberingExamples = uniqueSorted(item.numbering);
      evidence.push(Object.freeze({
        id: `heading-${item.level}-${item.style ?? "unstyled"}`,
        kind: "heading-pattern" as const,
        observed: { level: item.level, style: item.style },
        occurrences: item.count,
        confidence: 1,
        samples: Object.freeze(item.samples.slice(0, 3))
      }));
      if (numberingExamples.length > 0) {
        evidence.push(Object.freeze({
          id: `numbering-${item.level}-${item.style ?? "unstyled"}`,
          kind: "numbering" as const,
          observed: numberingExamples,
          occurrences: item.numbering.length,
          confidence: item.numbering.length / item.count,
          samples: numberingExamples.slice(0, 3)
        }));
      }
      return Object.freeze({
        level: item.level,
        style: item.style,
        count: item.count,
        numberingExamples
      });
    }));

  const numberingExamples = uniqueSorted(document.paragraphs.map((paragraph) => paragraph.listString ?? ""));
  const captionParagraphs = document.paragraphs.filter((paragraph) => paragraph.semantic?.role === "caption");
  const captionStyles = uniqueSorted(captionParagraphs.map((paragraph) => paragraph.style ?? ""));
  if (captionParagraphs.length > 0) {
    evidence.push(Object.freeze({
      id: "captions",
      kind: "caption" as const,
      observed: captionStyles,
      occurrences: captionParagraphs.length,
      confidence: captionStyles.length > 0 ? 1 : 0.5,
      samples: Object.freeze(captionParagraphs.slice(0, 3).map((item) => item.text))
    }));
  }

  const headerFooterEvidence = Object.freeze(document.sections
    .filter((section) => Boolean(normalizeText(section.headerText) || normalizeText(section.footerText)))
    .map((section) => {
      const item = Object.freeze({
        sectionIndex: section.index,
        headerText: normalizeText(section.headerText),
        footerText: normalizeText(section.footerText)
      });
      evidence.push(Object.freeze({
        id: `header-footer-${section.index}`,
        kind: "header-footer" as const,
        observed: item,
        occurrences: 1,
        confidence: 1,
        samples: Object.freeze([item.headerText, item.footerText].filter((value): value is string => Boolean(value)))
      }));
      return item;
    }));

  const styleGroups = new Map<string, { count: number; roles: Set<SemanticRole> }>();
  for (const paragraph of document.paragraphs) {
    const style = normalizeText(paragraph.style);
    if (!style) continue;
    const current = styleGroups.get(style) ?? { count: 0, roles: new Set<SemanticRole>() };
    current.count += 1;
    if (paragraph.semantic?.role) current.roles.add(paragraph.semantic.role);
    styleGroups.set(style, current);
  }
  const styles = Object.freeze([...styleGroups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([style, value]) => Object.freeze({ style, count: value.count, roles: Object.freeze([...value.roles].sort()) })));

  for (const style of styles) {
    evidence.push(Object.freeze({
      id: `style-${style.style}`,
      kind: "style" as const,
      observed: style,
      occurrences: style.count,
      confidence: 1,
      samples: Object.freeze([])
    }));
  }

  const confidenceSignals = [bodyFont.confidence, bodySize.confidence, bodyAlignment.confidence];
  if (pageSetups.length > 0) confidenceSignals.push(1);
  if (headingPatterns.length > 0) confidenceSignals.push(1);
  if (captionParagraphs.length > 0) confidenceSignals.push(1);
  const confidence = Math.max(0, Math.min(1, average(confidenceSignals.filter((value) => value > 0))));

  return Object.freeze({
    sectionCount: document.sections.length,
    dominantBodyFont: bodyFont.value,
    dominantBodySizePt: bodySize.value,
    dominantBodyAlignment: bodyAlignment.value,
    pageSetups: Object.freeze(pageSetups),
    styles,
    headingPatterns,
    numberingExamples,
    captionStyles,
    headerFooterEvidence,
    confidence,
    evidence: Object.freeze(evidence)
  });
}
