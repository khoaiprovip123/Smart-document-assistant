import { describe, expect, it } from "vitest";
import {
  AUTO_SHOW_TASKPANE_SETTING,
  readDocumentAutoOpenPreference,
  saveDocumentAutoOpenPreference,
  type OfficeSettingsLike
} from "../services/documentAutoOpenService";

function createSettings(initial = false) {
  let value = initial;
  const events: string[] = [];
  const settings: OfficeSettingsLike = {
    get(name) {
      events.push(`get:${name}`);
      return value;
    },
    set(name, next) {
      events.push(`set:${name}:${String(next)}`);
      value = Boolean(next);
    },
    saveAsync(callback) {
      events.push("save");
      callback({ status: "succeeded" });
    }
  };
  return { settings, events, getValue: () => value };
}

describe("document auto-open preference", () => {
  it("uses the Microsoft Office.AutoShowTaskpaneWithDocument document setting", async () => {
    const fixture = createSettings(false);

    await saveDocumentAutoOpenPreference(fixture.settings, true);

    expect(AUTO_SHOW_TASKPANE_SETTING).toBe("Office.AutoShowTaskpaneWithDocument");
    expect(fixture.events).toEqual([
      `set:${AUTO_SHOW_TASKPANE_SETTING}:true`,
      "save"
    ]);
    expect(fixture.getValue()).toBe(true);
    expect(readDocumentAutoOpenPreference(fixture.settings)).toBe(true);
  });

  it("rejects when Word cannot persist the document setting", async () => {
    const settings: OfficeSettingsLike = {
      get: () => false,
      set: () => undefined,
      saveAsync: (callback) => callback({ status: "failed", error: { message: "save failed" } })
    };

    await expect(saveDocumentAutoOpenPreference(settings, true)).rejects.toThrow("save failed");
  });
});
