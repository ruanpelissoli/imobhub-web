export const DEFAULT_COLUMNS = 3

export function resolveColumnCount(
  columns: number = DEFAULT_COLUMNS,
): number {
  if (!Number.isInteger(columns) || columns < 1) return DEFAULT_COLUMNS
  return columns
}
