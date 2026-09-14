import { describe, expect, it, vi } from "vitest";
import { RIBBON_FUNCTION_COMMANDS } from "../../ribbon/commandRegistry";
import { runRibbonCommand } from "../../ribbon/ribbonCommands";

describe("ribbon command registry", () => {
  it("registers the six direct Word commands used by the Ribbon", () => {
    expect(RIBBON_FUNCTION_COMMANDS.map((command) => command.functionName)).toEqual([
      "hpcRollback",
      "hpcNormalizeSelection",
      "hpcEnsureStyles",
      "hpcStandardizeTables",
      "hpcNumberHeadings",
      "hpcManageToc"
    ]);
  });

  it("always completes the Office command event on success", async () => {
    const completed = vi.fn();
    const action = vi.fn(async () => undefined);

    await runRibbonCommand({ completed }, action);

    expect(action).toHaveBeenCalledTimes(1);
    expect(completed).toHaveBeenCalledTimes(1);
  });

  it("always completes the Office command event when the action throws", async () => {
    const completed = vi.fn();
    const onError = vi.fn();
    const error = new Error("boom");

    await runRibbonCommand({ completed }, async () => { throw error; }, onError);

    expect(onError).toHaveBeenCalledWith(error);
    expect(completed).toHaveBeenCalledTimes(1);
  });
});
