import { createWordDesktopReleaseMatrix, type WordDesktopReleaseMatrix } from "./releaseQualification";

export function createDefaultWordDesktopReleaseMatrix(): WordDesktopReleaseMatrix {
  return createWordDesktopReleaseMatrix([
    {
      id: "windows-m365-current-channel",
      label: "Windows Word Desktop / Microsoft 365 Current Channel",
      required: true
    },
    {
      id: "windows-m365-monthly-enterprise",
      label: "Windows Word Desktop / Microsoft 365 Monthly Enterprise Channel",
      required: false
    }
  ]);
}
