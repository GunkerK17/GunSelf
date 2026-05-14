export function toIsoDate(input: Date | string): string {
  const value = input instanceof Date ? input : new Date(input);
  return value.toISOString();
}

export function nowIso(): string {
  return new Date().toISOString();
}
