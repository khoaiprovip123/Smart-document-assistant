export interface TocOptions {
  upperHeadingLevel: number;
  lowerHeadingLevel: number;
  arePageNumbersIncluded: boolean;
  arePageNumbersRightAligned: boolean;
  areBuiltInHeadingStylesUsed: boolean;
  useOutlineLevels: boolean;
}

export interface TocOperationResult {
  inserted: boolean;
  updated: number;
}

export function getTocOptions(): TocOptions {
  return {
    upperHeadingLevel: 1,
    lowerHeadingLevel: 4,
    arePageNumbersIncluded: true,
    arePageNumbersRightAligned: true,
    areBuiltInHeadingStylesUsed: true,
    useOutlineLevels: true
  };
}

export async function insertOrUpdateTableOfContents(): Promise<TocOperationResult> {
  if (typeof Office === "undefined" || Office.context?.host !== Office.HostType.Word) {
    throw new Error("Tính năng mục lục chỉ hoạt động trong Microsoft Word.");
  }
  if (!Office.context.requirements.isSetSupported("WordApiDesktop", "1.4")) {
    throw new Error("Microsoft Word hiện tại chưa hỗ trợ WordApiDesktop 1.4 để quản lý mục lục.");
  }

  const config = getTocOptions();
  return Word.run(async (context) => {
    const collection = context.document.tablesOfContents;
    collection.load("items");
    await context.sync();

    if (collection.items.length > 0) {
      collection.items.forEach((toc) => toc.updatePageNumbers());
      await context.sync();
      return { inserted: false, updated: collection.items.length };
    }

    const selection = context.document.getSelection();
    collection.add(selection, {
      upperHeadingLevel: config.upperHeadingLevel,
      lowerHeadingLevel: config.lowerHeadingLevel,
      includePageNumbers: config.arePageNumbersIncluded,
      rightAlignPageNumbers: config.arePageNumbersRightAligned,
      useBuiltInHeadingStyles: config.areBuiltInHeadingStylesUsed,
      useOutlineLevels: config.useOutlineLevels,
      useFields: false
    });
    await context.sync();
    return { inserted: true, updated: 0 };
  });
}
