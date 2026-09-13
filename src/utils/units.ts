const POINTS_PER_INCH = 72;
const MM_PER_INCH = 25.4;

export const mmToPoints = (mm: number): number => (mm / MM_PER_INCH) * POINTS_PER_INCH;
export const pointsToMm = (pt: number): number => (pt / POINTS_PER_INCH) * MM_PER_INCH;

export const nearlyEqual = (a: number, b: number, tolerance = 0.25): boolean => Math.abs(a - b) <= tolerance;
export const inRange = (value: number, min: number, max: number, tolerance = 0.25): boolean =>
  value >= min - tolerance && value <= max + tolerance;
