import { detectCurrentWordCapabilities } from "./capabilities";
import {
  createSemanticDocumentSnapshot,
  type CommentSnapshotV2,
  type FieldSnapshotV2,
  type ParagraphSnapshotV2,
  type PictureSnapshotV2,
  type SectionSnapshotV2,
  type SemanticDocumentSnapshot,
  type TableSnapshotV2,
  type TrackedChangeSnapshotV2
} from "./documentModel";
import { classifySemanticParagraphs } from "./semanticClassifier";

function isWordHost(): boolean {
  return typeof Office !== "undefined" && Office.context?.host === Office.HostType.Word;
}

export async function readSemanticDocumentSnapshot(): Promise<SemanticDocumentSnapshot> {
  if (!isWordHost()) throw new Error("HPC Smart Document Assistant phải được chạy trong Microsoft Word.");

  const capabilities = detectCurrentWordCapabilities();

  return Word.run(async (context) => {
    const body = context.document.body;
    const bodyAny = body as any;
    const documentAny = context.document as any;

    const paragraphs = body.paragraphs;
    paragraphs.load("text,style,alignment,firstLineIndent,spaceBefore,spaceAfter,lineSpacing,font/name,font/size");

    const sections = documentAny.sections;
    sections?.load?.("items");

    const tables = body.tables;
    tables.load("items,rowCount,style,values,horizontalAlignment");

    const pictures = body.inlinePictures;
    pictures.load("items,altTextTitle,altTextDescription,hyperlink,width,height");

    const ooxmlResult = capabilities.ooxml ? body.getOoxml() : undefined;
    const fields = capabilities.commentsFields ? bodyAny.fields : undefined;
    fields?.load?.("items,type,code,result/text");

    const comments = capabilities.commentsFields && typeof bodyAny.getComments === "function"
      ? bodyAny.getComments()
      : undefined;
    comments?.load?.("items,id,content,authorName,resolved");

    const trackedChanges = capabilities.trackedChanges && typeof bodyAny.getTrackedChanges === "function"
      ? bodyAny.getTrackedChanges()
      : undefined;
    trackedChanges?.load?.("items,type,text,author");

    await context.sync();

    const listItems = capabilities.lists
      ? paragraphs.items.map((paragraph) => (paragraph as any).listItemOrNullObject)
      : [];
    const parentTables = capabilities.lists
      ? paragraphs.items.map((paragraph) => (paragraph as any).parentTableOrNullObject)
      : [];

    if (listItems.length) listItems.forEach((item) => item?.load?.("isNullObject,level,listString"));
    if (parentTables.length) parentTables.forEach((table) => table?.load?.("isNullObject"));
    if (capabilities.uniqueParagraphIds) {
      paragraphs.items.forEach((paragraph) => (paragraph as any).load?.("uniqueLocalId"));
    }

    const sectionItems: any[] = sections?.items ?? [];
    const sectionPageSetups: any[] = [];
    const sectionHeaders: any[] = [];
    const sectionFooters: any[] = [];

    for (const section of sectionItems) {
      if (capabilities.pageSetupDesktop) {
        const setup = section.pageSetup;
        setup?.load?.([
          "paperSize", "orientation", "topMargin", "bottomMargin", "leftMargin", "rightMargin",
          "gutter", "sectionStart", "differentFirstPageHeaderFooter", "oddAndEvenPagesHeaderFooter"
        ]);
        sectionPageSetups.push(setup);
      } else {
        sectionPageSetups.push(undefined);
      }

      const header = typeof section.getHeader === "function" ? section.getHeader("Primary") : undefined;
      const footer = typeof section.getFooter === "function" ? section.getFooter("Primary") : undefined;
      header?.load?.("text");
      footer?.load?.("text");
      sectionHeaders.push(header);
      sectionFooters.push(footer);
    }

    await context.sync();

    const paragraphSnapshots: ParagraphSnapshotV2[] = paragraphs.items.map((paragraph, index) => {
      const paragraphAny = paragraph as any;
      const listItem = listItems[index];
      const parentTable = parentTables[index];
      return {
        index,
        text: paragraph.text,
        style: paragraph.style,
        uniqueLocalId: capabilities.uniqueParagraphIds ? paragraphAny.uniqueLocalId : undefined,
        fontName: paragraph.font.name || undefined,
        fontSize: typeof paragraph.font.size === "number" ? paragraph.font.size : undefined,
        alignment: String(paragraph.alignment),
        firstLineIndentPt: paragraph.firstLineIndent,
        spaceBeforePt: paragraph.spaceBefore,
        spaceAfterPt: paragraph.spaceAfter,
        lineSpacingPt: paragraph.lineSpacing,
        listLevel: listItem && !listItem.isNullObject ? listItem.level : undefined,
        listString: listItem && !listItem.isNullObject ? listItem.listString : undefined,
        inTable: parentTable ? !parentTable.isNullObject : undefined
      };
    });

    const sectionSnapshots: SectionSnapshotV2[] = sectionItems.map((_: any, index: number) => {
      const setup = sectionPageSetups[index];
      return {
        index,
        pageSetup: setup ? {
          paperSize: setup.paperSize === undefined ? undefined : String(setup.paperSize),
          orientation: setup.orientation === undefined ? undefined : String(setup.orientation),
          topMarginPt: setup.topMargin,
          bottomMarginPt: setup.bottomMargin,
          leftMarginPt: setup.leftMargin,
          rightMarginPt: setup.rightMargin,
          gutterPt: setup.gutter,
          sectionStart: setup.sectionStart === undefined ? undefined : String(setup.sectionStart),
          differentFirstPageHeaderFooter: setup.differentFirstPageHeaderFooter,
          oddAndEvenPagesHeaderFooter: setup.oddAndEvenPagesHeaderFooter
        } : undefined,
        headerText: sectionHeaders[index]?.text,
        footerText: sectionFooters[index]?.text
      };
    });

    const tableSnapshots: TableSnapshotV2[] = tables.items.map((table, index) => ({
      index,
      rowCount: table.rowCount,
      columnCount: table.values?.[0]?.length,
      style: table.style,
      horizontalAlignment: table.horizontalAlignment === undefined ? undefined : String(table.horizontalAlignment),
      values: table.values
    }));

    const fieldSnapshots: FieldSnapshotV2[] = (fields?.items ?? []).map((field: any, index: number) => ({
      index,
      type: field.type === undefined ? undefined : String(field.type),
      code: field.code,
      resultText: field.result?.text
    }));

    const pictureSnapshots: PictureSnapshotV2[] = pictures.items.map((picture, index) => ({
      index,
      altTextTitle: picture.altTextTitle,
      altTextDescription: picture.altTextDescription,
      hyperlink: picture.hyperlink,
      width: picture.width,
      height: picture.height
    }));

    const commentSnapshots: CommentSnapshotV2[] = (comments?.items ?? []).map((comment: any) => ({
      id: String(comment.id),
      content: comment.content,
      authorName: comment.authorName,
      resolved: comment.resolved
    }));

    const trackedChangeSnapshots: TrackedChangeSnapshotV2[] = (trackedChanges?.items ?? []).map((change: any, index: number) => ({
      index,
      type: change.type === undefined ? undefined : String(change.type),
      text: change.text,
      author: change.author
    }));

    return createSemanticDocumentSnapshot({
      capabilities,
      sections: sectionSnapshots,
      paragraphs: classifySemanticParagraphs(paragraphSnapshots),
      tables: tableSnapshots,
      fields: fieldSnapshots,
      inlinePictures: pictureSnapshots,
      comments: commentSnapshots,
      trackedChanges: trackedChangeSnapshots,
      ooxml: ooxmlResult?.value
    });
  });
}
