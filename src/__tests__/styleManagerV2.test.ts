import { describe, expect, it } from "vitest";
import { getProfile } from "../config/rules";
import { buildHpcStyleDefinitions } from "../services/styleManager";

describe("HPC style blueprints v1", () => {
  it("gives heading styles explicit size and bold formatting", () => {
    const definitions = buildHpcStyleDefinitions(getProfile("HPC-ND30"));
    expect(definitions.find((item) => item.name === "HPC.Heading1")).toMatchObject({
      type: "Paragraph",
      fontSize: 14,
      bold: true,
      alignment: "Left"
    });
    expect(definitions.find((item) => item.name === "HPC.Heading4")).toMatchObject({
      type: "Paragraph",
      fontSize: 13,
      bold: true
    });
  });

  it("gives caption and signature semantic formatting instead of font-only placeholders", () => {
    const definitions = buildHpcStyleDefinitions(getProfile("HPC-ND30"));
    expect(definitions.find((item) => item.name === "HPC.Caption")).toMatchObject({
      fontSize: 12,
      italic: true,
      alignment: "Centered"
    });
    expect(definitions.find((item) => item.name === "HPC.Signature")).toMatchObject({
      fontSize: 13,
      alignment: "Centered"
    });
  });
});
