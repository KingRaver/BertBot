export function assertNonEmpty(value: string | undefined, name: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is required`);
  }
  return value;
}
