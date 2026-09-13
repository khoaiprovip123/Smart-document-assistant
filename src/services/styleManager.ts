const STYLE_NAMES = [
  "HPC.Normal",
  "HPC.Title",
  "HPC.SubTitle",
  "HPC.Heading1",
  "HPC.Heading2",
  "HPC.Heading3",
  "HPC.Heading4",
  "HPC.Table",
  "HPC.TableHeader",
  "HPC.Caption",
  "HPC.Note",
  "HPC.Signature",
  "HPC.Recipient",
  "HPC.Appendix"
] as const;

export async function ensureHpcStyles(): Promise<{ created: string[]; skipped: string[] }> {
  if (!Office.context.requirements.isSetSupported("WordApi", "1.5")) {
    throw new Error("Microsoft Word hiện tại chưa hỗ trợ WordApi 1.5 để quản lý custom styles.");
  }

  return Word.run(async (context) => {
    const created: string[] = [];
    const skipped: string[] = [];

    for (const name of STYLE_NAMES) {
      const existing = context.document.getStyles().getByNameOrNullObject(name);
      existing.load("isNullObject");
      await context.sync();
      if (existing.isNullObject) {
        context.document.addStyle(name, "Paragraph");
        created.push(name);
      } else {
        skipped.push(name);
      }
    }

    await context.sync();
    return { created, skipped };
  });
}
