import { recordCompatibilityTransaction } from "../fixes/compatTransactionSession";
import { classifyParagraph } from "../rules/documentClassifier";
import { readSemanticDocumentSnapshot } from "../word/semanticWordService";
import { rollbackStore } from "./rollbackStore";
import { readDocumentSnapshot } from "./wordService";

export interface HeadingNumberingLevel {
  level: number;
  format: Array<string | number>;
}

export interface HeadingNumberingResult {
  numbered: number;
  skippedExistingLists: number;
}

export function getHeadingNumberingLevels(): HeadingNumberingLevel[] {
  return [
    { level: 0, format: [0] },
    { level: 1, format: [0, ".", 1] },
    { level: 2, format: [0, ".", 1, ".", 2] },
    { level: 3, format: [0, ".", 1, ".", 2, ".", 3] }
  ];
}

export async function normalizeHeadingNumbering(): Promise<HeadingNumberingResult> {
  if (typeof Office === "undefined" || Office.context?.host !== Office.HostType.Word) {
    throw new Error("Tính năng đánh số heading chỉ hoạt động trong Microsoft Word.");
  }
  if (!Office.context.requirements.isSetSupported("WordApi", "1.3")) {
    throw new Error("Microsoft Word hiện tại chưa hỗ trợ WordApi 1.3 để quản lý numbering.");
  }

  const semanticBefore = await readSemanticDocumentSnapshot();
  const snapshot = await readDocumentSnapshot();
  const headingCandidates = snapshot.paragraphs
    .map((paragraph) => ({ paragraph, classification: classifyParagraph(paragraph) }))
    .filter((item) => item.classification.role === "heading" && item.classification.headingLevel !== undefined);

  const candidates = headingCandidates.filter((item) => item.paragraph.listLevel === undefined);
  const skippedExistingLists = headingCandidates.length - candidates.length;
  if (candidates.length === 0) return { numbered: 0, skippedExistingLists };

  rollbackStore.save(snapshot);

  await Word.run(async (context) => {
    const paragraphs = context.document.body.paragraphs;
    paragraphs.load("text");
    await context.sync();

    const firstCandidate = candidates[0];
    const firstParagraph = paragraphs.items[firstCandidate.paragraph.index];
    if (!firstParagraph) throw new Error("Không tìm thấy heading đầu tiên để tạo numbering.");

    const list = firstParagraph.startNewList();
    list.load("id");
    await context.sync();

    for (const definition of getHeadingNumberingLevels()) {
      list.setLevelNumbering(definition.level, Word.ListNumbering.arabic, definition.format);
      list.setLevelIndents(definition.level, 18 * definition.level, 0);
    }

    firstParagraph.listItem.level = (firstCandidate.classification.headingLevel ?? 1) - 1;

    for (const candidate of candidates.slice(1)) {
      const paragraph = paragraphs.items[candidate.paragraph.index];
      if (!paragraph) continue;
      paragraph.attachToList(list.id, (candidate.classification.headingLevel ?? 1) - 1);
    }

    await context.sync();
  });

  recordCompatibilityTransaction({
    label: `V1 Numbering Heading (${candidates.length})`,
    before: semanticBefore,
    findingIds: []
  });

  return { numbered: candidates.length, skippedExistingLists };
}
