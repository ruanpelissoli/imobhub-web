export const DEFAULT_LINES = 1
export const FULL_LINE_WIDTH = '100%'
export const LAST_LINE_WIDTH = '60%'

function toWidthPattern(width?: string | string[]): string[] {
  const values = typeof width === 'string' ? [width] : (width ?? [])

  return values.flatMap((value) =>
    typeof value === 'string' && value.trim() !== '' ? [value.trim()] : [],
  )
}

export function resolveLineWidths(
  lines: number = DEFAULT_LINES,
  width?: string | string[],
): string[] {
  if (!Number.isInteger(lines) || lines < 1) return []

  const pattern = toWidthPattern(width)

  if (pattern.length === 0) {
    return Array.from({ length: lines }, (_, index) =>
      lines > 1 && index === lines - 1 ? LAST_LINE_WIDTH : FULL_LINE_WIDTH,
    )
  }

  return Array.from(
    { length: lines },
    (_, index) => pattern[index % pattern.length],
  )
}
