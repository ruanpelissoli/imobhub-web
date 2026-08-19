export type RawSearchParams = Record<string, string | string[] | undefined>

export interface DisplayParam {
  key: string
  value: string
}

export function toDisplayParams(params: RawSearchParams): DisplayParam[] {
  return Object.entries(params).flatMap(([key, value]) => {
    if (value === undefined) return []
    return [{ key, value: Array.isArray(value) ? value.join(', ') : value }]
  })
}
