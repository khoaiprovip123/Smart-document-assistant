import type { DocumentRuleProfile } from "../types";
import { mmToPoints } from "../utils/units";

type HpcStyleType = "Paragraph" | "Table";

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
}

const STYLE_BLUEPRINTS: ReadonlyArray<{ name: string; type: HpcStyleType }> = [
  { name: "HPC.Normal", type: "Paragraph" },
  { name: "HPC.Title", type: "Paragraph" },
  { name: "HPC.SubTitle", type: "Paragraph" },
  { name: "HPC.Heading1", type: "Paragraph" },
  { name: "HPC.Heading2", type: "Paragraph" },
  { name: "HPC.Heading3", type: "Paragraph" },
  { name: "HPC.Heading4", type: "Paragraph" },
  { name: "HPC.Table", type: "Table" },
  { name: "HPC.TableHeader", type: "Paragraph" },
  { name: "HPC.Caption", type: "Paragraph" },
  { name: "HPC.Note", type: "Paragraph" },
  { name: "HPC.Signature", type: "Paragraph" },
  { name: "HPC.Recipient", type: "Paragraph" },
  { name: "HPC.Appendix", type: "Paragraph" }
];

export function buildHpcStyleDefinitions(profile: DocumentRuleProfile): HpcStyleDefinition[] {
  return STYLE_BLUEPRINTS.map((blueprint) => {
    const shared: HpcStyleDefinition = {
      name: blueprint.name,
      type: blueprint.type,
      fontName: profile.body.fontName
    };

    if (blueprint.name !== "HPC.Normal") return shared;

    return {
      ...shared,
      fontSize: profile.body.fontSize.preferred,
      alignment: profile.body.alignment,
      firstLineIndentPt: profile.body.firstLineIndentMm
        ? mmToPoints(profile.body.firstLineIndentMm.preferred)
        : undefined,
      spaceBeforePt: profile.body.spaceBeforePt?.preferred,
      spaceAfterPt: profile.body.spaceAfterPt?.preferred,
      lineSpacingPt: profile.body.lineSpacingPt?.preferred
    };
  });
}

function applyStyleDefinition(style: Word.Style, definition: HpcStyleDefinition): void {
  style.font.name = definition.fontName;
  style.quickStyle = true;
  style.visibility = true;

  if (definition.fontSize !== undefined) style.font.size = definition.fontSize;
  if (definition.type !== "Paragraph") return;

  if (definition.alignment !== undefined) style.paragraphFormat.alignment = definition.alignment;
  if (definition.firstLineIndentPt !== undefined) style.paragraphFormat.firstLineIndent = definition.firstLineIndentPt;
  if (definition.spaceBeforePt !== undefined) style.paragraphFormat.spaceBefore = definition.spaceBeforePt;
  if (definition.spaceAfterPt !== undefined) style.paragraphFormat.spaceAfter = definition.spaceAfterPt;
  if (definition.lineSpacingPt !== undefined) style.paragraphFormat.lineSpacing = definition.lineSpacingPt;
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
