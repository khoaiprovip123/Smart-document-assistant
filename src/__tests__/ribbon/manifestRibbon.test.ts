import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const manifest = readFileSync("manifest.xml", "utf8");

function controlXml(id: string): string {
  const pattern = new RegExp(`<Control[^>]+id="${id}"[\\s\\S]*?</Control>`);
  return manifest.match(pattern)?.[0] ?? "";
}

describe("HPC ribbon manifest", () => {
  it("uses a dedicated HPC VĂN BẢN custom tab instead of the Home tab", () => {
    expect(manifest).toContain('<CustomTab id="HPC.Tab">');
    expect(manifest).toContain('DefaultValue="HPC VĂN BẢN"');
    expect(manifest).not.toContain('<OfficeTab id="TabHome">');
  });

  it("declares the core ribbon groups", () => {
    for (const id of [
      "HPC.Group.Check",
      "HPC.Group.Fix",
      "HPC.Group.Format",
      "HPC.Group.Table",
      "HPC.Group.Structure",
      "HPC.Group.Standards",
      "HPC.Group.Release",
      "HPC.Group.Tools"
    ]) {
      expect(manifest).toContain(`id="${id}"`);
    }
  });

  it("wires safe short operations directly through ExecuteFunction", () => {
    const expected = [
      ["HPC.Fix.Rollback", "hpcRollback"],
      ["HPC.Format.NormalizeSelection", "hpcNormalizeSelection"],
      ["HPC.Format.EnsureStyles", "hpcEnsureStyles"],
      ["HPC.Table.Standardize", "hpcStandardizeTables"],
      ["HPC.Structure.NumberHeadings", "hpcNumberHeadings"],
      ["HPC.Structure.ManageToc", "hpcManageToc"]
    ] as const;

    for (const [controlId, functionName] of expected) {
      const control = controlXml(controlId);
      expect(control).toContain('xsi:type="ExecuteFunction"');
      expect(control).toContain(`<FunctionName>${functionName}</FunctionName>`);
    }
  });

  it("keeps review and detail workflows in the Task Pane", () => {
    for (const id of [
      "HPC.Check.Open",
      "HPC.Fix.Open",
      "HPC.Standards.Open",
      "HPC.Release.Open",
      "HPC.Tools.Open"
    ]) {
      const control = controlXml(id);
      expect(control).toContain('xsi:type="ShowTaskpane"');
      expect(control).toContain('<SourceLocation resid="Taskpane.Url" />');
    }
  });
});
