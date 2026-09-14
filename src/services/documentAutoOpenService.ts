export const AUTO_SHOW_TASKPANE_SETTING = "Office.AutoShowTaskpaneWithDocument";

export interface OfficeAsyncResultLike {
  status: string;
  error?: { message?: string };
}

export interface OfficeSettingsLike {
  get(name: string): unknown;
  set(name: string, value: unknown): void;
  saveAsync(callback: (result: OfficeAsyncResultLike) => void): void;
}

export function readDocumentAutoOpenPreference(settings: OfficeSettingsLike): boolean {
  return settings.get(AUTO_SHOW_TASKPANE_SETTING) === true;
}

export function saveDocumentAutoOpenPreference(settings: OfficeSettingsLike, enabled: boolean): Promise<void> {
  settings.set(AUTO_SHOW_TASKPANE_SETTING, enabled);
  return new Promise((resolve, reject) => {
    settings.saveAsync((result) => {
      if (String(result.status).toLowerCase() === "succeeded") {
        resolve();
        return;
      }
      reject(new Error(result.error?.message || "Không thể lưu cấu hình tự mở HPC Assistant vào tài liệu hiện tại."));
    });
  });
}

function currentSettings(): OfficeSettingsLike {
  if (typeof Office === "undefined" || !Office.context?.document?.settings) {
    throw new Error("Tính năng tự mở chỉ hoạt động khi add-in đang chạy trong Microsoft Word.");
  }
  return Office.context.document.settings as OfficeSettingsLike;
}

export function readCurrentDocumentAutoOpenPreference(): boolean {
  return readDocumentAutoOpenPreference(currentSettings());
}

export async function setCurrentDocumentAutoOpenPreference(enabled: boolean): Promise<void> {
  await saveDocumentAutoOpenPreference(currentSettings(), enabled);
}
