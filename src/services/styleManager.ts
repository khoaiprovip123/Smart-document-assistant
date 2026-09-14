import type { DocumentRuleProfile, ParagraphRuleSet } from "../types";
import { mmToPoints } from "../utils/units";

type HpcStyleType = "Paragraph" | "Table";
type HpcOutlineLevel =
  | "OutlineLevel1"
  | "OutlineLevel2"
  | "OutlineLevel3"
  | "OutlineLevel4"
  | "OutlineLevelBodyText";

export interface HpcStyleDefinition {
  name: string;
  type: HpcStyleType;
  fontName: string;
  fontSize?: number;
  alignment?: DocumentRuleProfile["body"]["alignment"];
  firstLineIndentPt?: number;
  spaceBeforePt?: number;
  spaceAfterPt?: number;
  lineSpacingPt?: number;
  bold?: boolean;
  italic?: boolean;
  outlineLevel?: HpcOutlineLevel;
}

function fromParagraphRule(
  name: string,
  rule: ParagraphRuleSet,
  overrides: Partial<HpcStyleDefinition> = {}
): HpcStyleDefinition {
  return {
    name,
    type: "Paragraph",
    fontName: rule.fontName,
    fontSize: rule.fontSize.preferred,
    alignment: rule.alignment,
    firstLineIndentPt: rule.firstLineIndentMm ? mmToPoints(rule.firstLineIndentMm.preferred) : undefined,
    spaceBeforePt: rule.spaceBeforePt?.preferred,
    spaceAfterPt: rule.spaceAfterPt?.preferred,
    lineSpacingPt: rule.lineSpacingPt?.preferred,
    bold: rule.bold,
    italic: rule.italic,
    outlineLevel: "OutlineLevelBodyText",
    ...overrides
  };
}

export function buildHpcStyleDefinitions(profile: DocumentRuleProfile): HpcStyleDefinition[] {
  const heading1 = profile.headings?.[1] ?? profile.body;
  const heading2 = profile.headings?.[2] ?? heading1;
  const heading3 = profile.headings?.[3] ?? heading2;
  const heading4 = profile.headings?.[4] ?? heading3;

  return [
    fromParagraphRule("HPC.Normal", profile.body),
    {
      name: "HPC.Title",
      type: "Paragraph",
      fontName: profile.body.fontName,
      fontSize: 16,
      alignment: "Centered",
      firstLineIndentPt: 0,
      spaceBeforePt: 0,
      spaceAfterPt: 6,
      bold: true,
      outlineLevel: "OutlineLevelBodyText"
    },
    {
      name: "HPC.SubTitle",
      type: "Paragraph",
      fontName: profile.body.fontName,
      fontSize: 14,
      alignment: "Centered",
      firstLineIndentPt: 0,
      spaceBeforePt: 0,
      spaceAfterPt: 6,
      italic: true,
      outlineLevel: "OutlineLevelBodyText"
    },
    fromParagraphRule("HPC.Heading1", heading1, { outlineLevel: "OutlineLevel1" }),
    fromParagraphRule("HPC.Heading2", heading2, { outlineLevel: "OutlineLevel2" }),
    fromParagraphRule("HPC.Heading3", heading3, { outlineLevel: "OutlineLevel3" }),
    fromParagraphRule("HPC.Heading4", heading4, { outlineLevel: "OutlineLevel4" }),
    {
      name: "HPC.Table",
      type: "Table",
      fontName: profile.body.fontName,
      fontSize: 12
    },
    {
      name: "HPC.TableHeader",
      type: "Paragraph",
      fontName: profile.body.fontName,
      fontSize: 12,
      alignment: "Centered",
      firstLineIndentPt: 0,
      bold: true,
      outlineLevel: "OutlineLevelBodyText"
    },
    {
      name: "HPC.Caption",
      type: "Paragraph",
      fontName: profile.body.fontName,
      fontSize: 12,
      alignment: "Centered",
      firstLineIndentPt: 0,
      italic: true,
      outlineLevel: "OutlineLevelBodyText"
    },
    {
      name: "HPC.Note",
      type: "Paragraph",
      fontName: profile.body.fontName,
      fontSize: 11,
      alignment: "Left",
      firstLineIndentPt: 0,
      italic: true,
      outlineLevel: "OutlineLevelBodyText"
    },
    {
      name: "HPC.Signature",
      type: "Paragraph",
      fontName: profile.body.fontName,
      fontSize: 13,
      alignment: "Centered",
      firstLineIndentPt: 0,
      bold: true,
      outlineLevel: "OutlineLevelBodyText"
    },
    {
      name: "HPC.Recipient",
      type: "Paragraph",
      fontName: profile.body.fontName,
      fontSize: 11,
      alignment: "Left",
      firstLineIndentPt: 0,
      outlineLevel: "OutlineLevelBodyText"
    },
    {
      name: "HPC.Appendix",
      type: "Paragraph",
      fontName: profile.body.fontName,
      fontSize: 14,
      alignment: "Centered",
      firstLineIndentPt: 0,
      bold: true,
      outlineLevel: "OutlineLevelBodyText"
    }
  ];
}

function applyStyleDefinition(style: Word.Style, definition: HpcStyleDefinition): void {
  style.font.name = definition.fontName;
  style.quickStyle = true;
  style.visibility = true;

  if (definition.fontSize !== undefined) style.font.size = definition.fontSize;
  if (definition.bold !== undefined) style.font.bold = definition.bold;
  if (definition.italic !== undefined) style.font.italic = definition.italic;
  if (definition.type !== "Paragraph") return;

  if (definition.alignment !== undefined) style.paragraphFormat.alignment = definition.alignment;
  if (definition.firstLineIndentPt !== undefined) style.paragraphFormat.firstLineIndent = definition.firstLineIndentPt;
  if (definition.spaceBeforePt !== undefined) style.paragraphFormat.spaceBefore = definition.spaceBeforePt;
  if (definition.spaceAfterPt !== undefined) style.paragraphFormat.spaceAfter = definition.spaceAfterPt;
  if (definition.lineSpacingPt !== undefined) style.paragraphFormat.lineSpacing = definition.lineSpacingPt;
  if (definition.outlineLevel !== undefined) style.paragraphFormat.outlineLevel = definition.outlineLevel;
}

export async function ensureHpcStyles(
  profile: DocumentRuleProfile
): Promise<{ created: string[]; updated: string[]; conflicts: string[] }> {
  if (!Office.context.requirements.isSetSupported("WordApi", "1.5")) {
    throw new Error("Microsoft Word hiện tại chưa hỗ trợ WordApi 1.5 để quản lý custom styles.");
  }

  const definitions = buildHpcStyleDefinitions(profile);

  return Word.run(async (context) => {
    const created: string[] = [];
    const updated: string[] = [];
    const conflicts: string[] = [];

    for (const definition of definitions) {
      const existing = context.document.getStyles().getByNameOrNullObject(definition.name);
      existing.load("isNullObject,type");
      await context.sync();

      if (existing.isNullObject) {
        const style = context.document.addStyle(definition.name, definition.type);
        applyStyleDefinition(style, definition);
        created.push(definition.name);
        continue;
      }

      if (String(existing.type) !== definition.type) {
        conflicts.push(definition.name);
        continue;
      }

      applyStyleDefinition(existing, definition);
      updated.push(definition.name);
    }

    await context.sync();
    return { created, updated, conflicts };
  });
}
