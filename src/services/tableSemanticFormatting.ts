export type SemanticCellAlignment = "Left" | "Centered" | "Right" | "Justified" | "Preserve";

export interface TableColumnAlignmentDecision {
  columnIndex: number;
  header: string;
  headerAlignment: SemanticCellAlignment;
  bodyAlignment: SemanticCellAlignment;
  confidence: number;
  reason: string;
}

export interface SemanticTablePlan {
  columns: readonly TableColumnAlignmentDecision[];
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, " ")
    .trim();
}

function containsAny(value: string, phrases: readonly string[]): boolean {
  return phrases.some((phrase) => value === phrase || value.includes(phrase));
}

const CENTER_HEADERS = [
  "stt",
  "so tt",
  "ma",
  "ma so",
  "ky hieu",
  "ngay",
  "ngay thang",
  "thang",
  "nam",
  "trang thai",
  "don vi tinh",
  "dvt"
] as const;

const RIGHT_HEADERS = [
  "sl",
  "so luong",
  "don gia",
  "thanh tien",
  "tong tien",
  "gia tri",
  "chi phi",
  "ty le",
  "phan tram",
  "%"
] as const;

const LEFT_HEADERS = [
  "ten",
  "ho ten",
  "ten hang",
  "ten hang hoa",
  "ten thiet bi",
  "noi dung",
  "mo ta",
  "ghi chu",
  "dien giai",
  "yeu cau"
] as const;

function nonEmpty(values: readonly string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}

function ratio(values: readonly string[], predicate: (value: string) => boolean): number {
  const items = nonEmpty(values);
  if (items.length === 0) return 0;
  return items.filter(predicate).length / items.length;
}

function isNumericLike(value: string): boolean {
  const normalized = value.trim().replace(/\s+/g, "");
  return /^[-+]?\d[\d.,]*(?:%|đ|₫|vnd)?$/i.test(normalized);
}

function isDateLike(value: string): boolean {
  const normalized = value.trim();
  return /^(?:\d{1,2}[\/.-]){2}\d{2,4}$/.test(normalized) || /^\d{1,2}[\/.-]\d{1,2}$/.test(normalized);
}

function isShortCode(value: string): boolean {
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= 16 && /^[A-Z0-9._\/-]+$/i.test(normalized);
}

export function inferColumnAlignment(
  header: string,
  values: readonly string[],
  columnIndex = 0
): TableColumnAlignmentDecision {
  const normalizedHeader = normalize(header);

  if (containsAny(normalizedHeader, RIGHT_HEADERS)) {
    return {
      columnIndex,
      header,
      headerAlignment: "Centered",
      bodyAlignment: "Right",
      confidence: 0.98,
      reason: "header:numeric-or-money"
    };
  }

  if (containsAny(normalizedHeader, CENTER_HEADERS)) {
    return {
      columnIndex,
      header,
      headerAlignment: "Centered",
      bodyAlignment: "Centered",
      confidence: 0.98,
      reason: "header:identifier-date-status"
    };
  }

  if (containsAny(normalizedHeader, LEFT_HEADERS)) {
    return {
      columnIndex,
      header,
      headerAlignment: "Left",
      bodyAlignment: "Left",
      confidence: 0.96,
      reason: "header:textual-content"
    };
  }

  const dateRatio = ratio(values, isDateLike);
  if (dateRatio >= 0.8) {
    return {
      columnIndex,
      header,
      headerAlignment: "Centered",
      bodyAlignment: "Centered",
      confidence: 0.84,
      reason: "values:date"
    };
  }

  const numericRatio = ratio(values, isNumericLike);
  if (numericRatio >= 0.85) {
    return {
      columnIndex,
      header,
      headerAlignment: "Centered",
      bodyAlignment: "Right",
      confidence: 0.84,
      reason: "values:numeric"
    };
  }

  const codeRatio = ratio(values, isShortCode);
  if (codeRatio >= 0.9) {
    return {
      columnIndex,
      header,
      headerAlignment: "Centered",
      bodyAlignment: "Centered",
      confidence: 0.78,
      reason: "values:short-code"
    };
  }

  return {
    columnIndex,
    header,
    headerAlignment: "Preserve",
    bodyAlignment: "Preserve",
    confidence: 0.5,
    reason: "ambiguous:preserve-existing"
  };
}

export function buildSemanticTablePlan(values: readonly (readonly string[])[]): SemanticTablePlan {
  const header = values[0] ?? [];
  const columnCount = header.length;
  const columns = Array.from({ length: columnCount }, (_, columnIndex) => {
    const bodyValues = values.slice(1).map((row) => row[columnIndex] ?? "");
    return Object.freeze(inferColumnAlignment(header[columnIndex] ?? "", bodyValues, columnIndex));
  });

  return Object.freeze({ columns: Object.freeze(columns) });
}
