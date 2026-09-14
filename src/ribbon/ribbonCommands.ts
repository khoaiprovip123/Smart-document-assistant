import { getProfile } from "../config/rules";
import { normalizeHeadingNumbering } from "../services/headingNumberingService";
import { ensureHpcStyles } from "../services/styleManager";
import { standardizeTables } from "../services/tableService";
import { insertOrUpdateTableOfContents } from "../services/tocService";
import { normalizeSelectedText, rollbackLastChange } from "../services/wordService";

export interface RibbonCommandEvent {
  completed(): void;
}

export type RibbonCommandAction = () => void | Promise<void>;
export type RibbonCommandErrorHandler = (error: unknown) => void;

const reportRibbonError: RibbonCommandErrorHandler = (error) => {
  console.error("HPC Ribbon command failed", error);
};

export async function runRibbonCommand(
  event: RibbonCommandEvent,
  action: RibbonCommandAction,
  onError: RibbonCommandErrorHandler = reportRibbonError
): Promise<void> {
  try {
    await action();
  } catch (error) {
    onError(error);
  } finally {
    event.completed();
  }
}

function defaultProfile() {
  return getProfile("HPC-ND30");
}

export async function hpcRollback(event: RibbonCommandEvent): Promise<void> {
  await runRibbonCommand(event, async () => {
    await rollbackLastChange();
  });
}

export async function hpcNormalizeSelection(event: RibbonCommandEvent): Promise<void> {
  await runRibbonCommand(event, async () => {
    await normalizeSelectedText(defaultProfile());
  });
}

export async function hpcEnsureStyles(event: RibbonCommandEvent): Promise<void> {
  await runRibbonCommand(event, async () => {
    await ensureHpcStyles(defaultProfile());
  });
}

export async function hpcStandardizeTables(event: RibbonCommandEvent): Promise<void> {
  await runRibbonCommand(event, async () => {
    await standardizeTables(defaultProfile());
  });
}

export async function hpcNumberHeadings(event: RibbonCommandEvent): Promise<void> {
  await runRibbonCommand(event, async () => {
    await normalizeHeadingNumbering();
  });
}

export async function hpcManageToc(event: RibbonCommandEvent): Promise<void> {
  await runRibbonCommand(event, async () => {
    await insertOrUpdateTableOfContents();
  });
}

export function registerRibbonCommands(): void {
  if (typeof Office === "undefined" || !Office.actions) return;

  Office.actions.associate("hpcRollback", hpcRollback);
  Office.actions.associate("hpcNormalizeSelection", hpcNormalizeSelection);
  Office.actions.associate("hpcEnsureStyles", hpcEnsureStyles);
  Office.actions.associate("hpcStandardizeTables", hpcStandardizeTables);
  Office.actions.associate("hpcNumberHeadings", hpcNumberHeadings);
  Office.actions.associate("hpcManageToc", hpcManageToc);
}

if (typeof Office !== "undefined") {
  Office.onReady(() => registerRibbonCommands());
}
