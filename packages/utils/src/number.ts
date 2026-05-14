export function toFixedNumber(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
