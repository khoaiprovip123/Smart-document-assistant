import { describe, expect, it } from "vitest";
import { getProfile } from "../config/rules";
import { buildHpcStyleDefinitions } from "../services/styleManager";
import { mmToPoints } from "../utils/units";

describe("HPC style definitions", () => {
  it("derives HPC.Normal formatting from the active rule profile", () => {
    const profile = getProfile("HPC-ND30");
    const definitions = buildHpcStyleDefinitions(profile);
    const normal = definitions.find((item) => item.name === "HPC.Normal");

    expect(normal).toBeDefined();
    expect(normal).toMatchObject({
      name: "HPC.Normal",
      type: "Paragraph",
      fontName: "Times New Roman",
      fontSize: 13,
      alignment: "Justified"
    });
    expect(normal?.firstLineIndentPt).toBeCloseTo(mmToPoints(10), 5);
  });

  it("uses a real table style for HPC.Table and preserves all expected style names", () => {
    const profile = getProfile("HPC-ND30");
    const definitions = buildHpcStyleDefinitions(profile);
    const names = definitions.map((item) => item.name);

    expect(definitions.find((item) => item.name === "HPC.Table")?.type).toBe("Table");
    expect(names).toEqual([
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
    ]);
  });
});
