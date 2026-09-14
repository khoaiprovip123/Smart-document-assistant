import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const manifest = readFileSync("manifest.xml", "utf8");

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
});
