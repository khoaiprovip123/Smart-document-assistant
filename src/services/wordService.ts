import type { DocumentRuleProfile, DocumentSnapshot, Finding, ParagraphSnapshot } from "../types";
import { mmToPoints } from "../utils/units";
import { assertRollbackSafe, rollbackStore } from "./rollbackStore";

function isWordHost(): boolean {
  return typeof Office !== "undefined" && Office.context?.host === Office.HostType.Word;
}

function pageSetupSupported(): boolean {
  return (
    typeof Office !== "undefined" &&
    Office.context?.requirements?.isSetSupported("WordApiDesktop", "1.3") === true
  );
}

function listMetadataSupported(): boolean {
  return (
    typeof Office !== "undefined" &&
    Office.context?.requirements?.isSetSupported("WordApi", "1.3") === true
  );
}

export async function readDocumentSnapshot(): Promise<DocumentSnapshot> {
  if (!isWordHost()) {
    throw new Error("HPC Smart Document Assistant phải được chạy trong Microsoft Word.");
  }

  return Word.run(async (context) => {
    const paragraphs = context.document.body.paragraphs;
    paragraphs.load("text,style,alignment,firstLineIndent,spaceBefore,spaceAfter,lineSpacing,font/name,font/size");

    const supportsPageSetup = pageSetupSupported();
    const pageSetup = supportsPageSetup ? context.document.pageSetup : undefined;
    if (pageSetup) {
      pageSetup.load([
        "paperSize",
        "orientation",
        "topMargin",
        "bottomMargin",
        "leftMargin",
        "rightMargin"
      ]);
    }

    await context.sync();

    const listItems = listMetadataSupported() ? paragraphs.items.map((paragraph) => paragraph.listItemOrNullObject) : [];
    if (listItems.length > 0) {
      listItems.forEach((item) => item.load("isNullObject,level,listString"));
      await context.sync();
    }

    const paragraphSnapshots: ParagraphSnapshot[] = paragraphs.items.map((paragraph, index) => {
      const listItem = listItems[index];
      return {
        index,
        text: paragraph.text,
        style: paragraph.style,
        fontName: paragraph.font.name || undefined,
        fontSize: typeof paragraph.font.size === "number" ? paragraph.font.size : undefined,
        alignment: String(paragraph.alignment),
        firstLineIndentPt: paragraph.firstLineIndent,
        spaceBeforePt: paragraph.spaceBefore,
        spaceAfterPt: paragraph.spaceAfter,
        lineSpacingPt: paragraph.lineSpacing,
        listLevel: listItem && !listItem.isNullObject ? listItem.level : undefined,
        listString: listItem && !listItem.isNullObject ? listItem.listString : undefined
      };
    });

    return {
      supportsPageSetup,
      pageSetup: pageSetup
        ? {
            paperSize: String(pageSetup.paperSize),
            orientation: String(pageSetup.orientation),
            topMarginPt: pageSetup.topMargin,
            bottomMarginPt: pageSetup.bottomMargin,
            leftMarginPt: pageSetup.leftMargin,
            rightMarginPt: pageSetup.rightMargin
          }
        : undefined,
      paragraphs: paragraphSnapshots
    };
  });
}

function isPageSetupField(field: Finding["field"]): boolean {
  return ["marginTop", "marginBottom", "marginLeft", "marginRight", "paperSize", "orientation"].includes(
    field ?? ""
  );
}

export async function applyFindings(profile: DocumentRuleProfile, findings: Finding[]): Promise<void> {
  const actionable = findings.filter((finding) => finding.autoFixable);
  if (!actionable.length) return;

  const before = await readDocumentSnapshot();
  rollbackStore.save(before);

  await Word.run(async (context) => {
    const paragraphs = context.document.body.paragraphs;
    paragraphs.load("text");
    await context.sync();

    if (pageSetupSupported() && actionable.some((finding) => isPageSetupField(finding.field))) {
      const setup = context.document.pageSetup;
      for (const finding of actionable) {
        switch (finding.field) {
          case "paperSize":
            setup.paperSize = "A4";
            break;
          case "orientation":
            setup.orientation = profile.page.orientation;
            break;
          case "marginTop":
            setup.topMargin = mmToPoints(profile.page.margins.top.preferred);
            break;
          case "marginBottom":
            setup.bottomMargin = mmToPoints(profile.page.margins.bottom.preferred);
            break;
          case "marginLeft":
            setup.leftMargin = mmToPoints(profile.page.margins.left.preferred);
            break;
          case "marginRight":
            setup.rightMargin = mmToPoints(profile.page.margins.right.preferred);
            break;
        }
      }
    }

    for (const finding of actionable) {
      if (finding.paragraphIndex === undefined) continue;
      const paragraph = paragraphs.items[finding.paragraphIndex];
      if (!paragraph) continue;

      switch (finding.field) {
        case "fontName":
          paragraph.font.name = finding.fix?.fontName ?? profile.body.fontName;
          break;
        case "fontSize":
          paragraph.font.size = finding.fix?.fontSize ?? profile.body.fontSize.preferred;
          break;
        case "alignment":
          paragraph.alignment = (finding.fix?.alignment ?? profile.body.alignment) as Word.Alignment;
          break;
        case "firstLineIndent":
          if (finding.fix?.firstLineIndentPt !== undefined) {
            paragraph.firstLineIndent = finding.fix.firstLineIndentPt;
          } else if (profile.body.firstLineIndentMm) {
            paragraph.firstLineIndent = mmToPoints(profile.body.firstLineIndentMm.preferred);
          }
          break;
        case "spaceBefore":
          if (finding.fix?.spaceBeforePt !== undefined) paragraph.spaceBefore = finding.fix.spaceBeforePt;
          else if (profile.body.spaceBeforePt) paragraph.spaceBefore = profile.body.spaceBeforePt.preferred;
          break;
        case "spaceAfter":
          if (finding.fix?.spaceAfterPt !== undefined) paragraph.spaceAfter = finding.fix.spaceAfterPt;
          else if (profile.body.spaceAfterPt) paragraph.spaceAfter = profile.body.spaceAfterPt.preferred;
          break;
        case "lineSpacing":
          if (finding.fix?.lineSpacingPt !== undefined) paragraph.lineSpacing = finding.fix.lineSpacingPt;
          else if (profile.body.lineSpacingPt) paragraph.lineSpacing = profile.body.lineSpacingPt.preferred;
          break;
      }
    }

    await context.sync();
  });
}

export async function rollbackLastChange(): Promise<boolean> {
  const snapshot = rollbackStore.get();
  if (!snapshot) return false;

  const current = await readDocumentSnapshot();
  assertRollbackSafe(snapshot, current);

  await Word.run(async (context) => {
    const paragraphs = context.document.body.paragraphs;
    paragraphs.load("text");
    await context.sync();

    if (snapshot.supportsPageSetup && snapshot.pageSetup && pageSetupSupported()) {
      const setup = context.document.pageSetup;
      if (snapshot.pageSetup.paperSize) setup.paperSize = snapshot.pageSetup.paperSize as Word.PaperSize;
      if (snapshot.pageSetup.orientation) setup.orientation = snapshot.pageSetup.orientation as Word.PageOrientation;
      if (snapshot.pageSetup.topMarginPt !== undefined) setup.topMargin = snapshot.pageSetup.topMarginPt;
      if (snapshot.pageSetup.bottomMarginPt !== undefined) setup.bottomMargin = snapshot.pageSetup.bottomMarginPt;
      if (snapshot.pageSetup.leftMarginPt !== undefined) setup.leftMargin = snapshot.pageSetup.leftMarginPt;
      if (snapshot.pageSetup.rightMarginPt !== undefined) setup.rightMargin = snapshot.pageSetup.rightMarginPt;
    }

    snapshot.paragraphs.forEach((saved) => {
      const paragraph = paragraphs.items[saved.index];
      if (!paragraph) return;
      if (saved.fontName) paragraph.font.name = saved.fontName;
      if (saved.fontSize !== undefined) paragraph.font.size = saved.fontSize;
      if (saved.alignment) paragraph.alignment = saved.alignment as Word.Alignment;
      if (saved.firstLineIndentPt !== undefined) paragraph.firstLineIndent = saved.firstLineIndentPt;
      if (saved.spaceBeforePt !== undefined) paragraph.spaceBefore = saved.spaceBeforePt;
      if (saved.spaceAfterPt !== undefined) paragraph.spaceAfter = saved.spaceAfterPt;
      if (saved.lineSpacingPt !== undefined) paragraph.lineSpacing = saved.lineSpacingPt;
    });

    await context.sync();
  });

  rollbackStore.clear();
  return true;
}

export async function normalizeSelectedText(profile: DocumentRuleProfile): Promise<void> {
  if (!isWordHost()) throw new Error("Tính năng chỉ hoạt động trong Microsoft Word.");

  const before = await readDocumentSnapshot();
  rollbackStore.save(before);

  await Word.run(async (context) => {
    const range = context.document.getSelection();
    range.font.name = profile.body.fontName;
    range.font.size = profile.body.fontSize.preferred;
    const paragraphs = range.paragraphs;
    paragraphs.load("text");
    await context.sync();
    paragraphs.items.forEach((paragraph) => {
      paragraph.alignment = profile.body.alignment;
      if (profile.body.firstLineIndentMm) {
        paragraph.firstLineIndent = mmToPoints(profile.body.firstLineIndentMm.preferred);
      }
    });
    await context.sync();
  });
}

export async function selectFinding(finding: Finding): Promise<boolean> {
  if (!isWordHost()) throw new Error("Tính năng chỉ hoạt động trong Microsoft Word.");
  if (finding.paragraphIndex === undefined) return false;

  return Word.run(async (context) => {
    const paragraphs = context.document.body.paragraphs;
    paragraphs.load("text");
    await context.sync();
    const paragraph = paragraphs.items[finding.paragraphIndex as number];
    if (!paragraph) return false;
    paragraph.getRange().select();
    await context.sync();
    return true;
  });
}
