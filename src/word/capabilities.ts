export interface WordCapabilityMatrix {
  wordApi11: boolean;
  lists: boolean;
  commentsFields: boolean;
  styles15: boolean;
  trackedChanges: boolean;
  uniqueParagraphIds: boolean;
  pageSetupDesktop: boolean;
  tocDesktop: boolean;
  ooxml: boolean;
  inlinePictures: boolean;
}

export type RequirementSupportProbe = (setName: string, version: string) => boolean;

export function buildWordCapabilityMatrix(isSupported: RequirementSupportProbe): WordCapabilityMatrix {
  const wordApi11 = isSupported("WordApi", "1.1");
  return Object.freeze({
    wordApi11,
    lists: isSupported("WordApi", "1.3"),
    commentsFields: isSupported("WordApi", "1.4"),
    styles15: isSupported("WordApi", "1.5"),
    trackedChanges: isSupported("WordApi", "1.6"),
    uniqueParagraphIds: isSupported("WordApi", "1.6"),
    pageSetupDesktop: isSupported("WordApiDesktop", "1.3"),
    tocDesktop: isSupported("WordApiDesktop", "1.4"),
    ooxml: wordApi11,
    inlinePictures: wordApi11
  });
}

export function detectCurrentWordCapabilities(): WordCapabilityMatrix {
  const probe: RequirementSupportProbe = (setName, version) =>
    typeof Office !== "undefined" &&
    Office.context?.requirements?.isSetSupported(setName, version) === true;
  return buildWordCapabilityMatrix(probe);
}
