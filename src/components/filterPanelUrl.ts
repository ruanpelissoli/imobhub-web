import { SEARCH_RESULTS_PATH, toTransactionType } from './searchBarUrl'

export const PROPERTY_TYPE_OPTIONS: ReadonlyArray<{
  value: string
  label: string
}> = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'sobrado', label: 'Sobrado' },
  { value: 'cobertura', label: 'Cobertura' },
  { value: 'kitnet', label: 'Kitnet' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'terreno', label: 'Terreno' },
]

export const FILTER_PARAM_KEYS = [
  'transaction_type',
  'property_type',
  'min_price',
  'max_price',
  'bedrooms',
  'bathrooms',
  'parking_spots',
  'min_area',
  'city',
  'neighborhood',
] as const

export type FilterParamKey = (typeof FILTER_PARAM_KEYS)[number]

export type FilterPanelValues = Partial<Record<FilterParamKey, string>>

const DECIMAL_KEYS: ReadonlySet<FilterParamKey> = new Set([
  'min_price',
  'max_price',
  'min_area',
])

const INTEGER_KEYS: ReadonlySet<FilterParamKey> = new Set([
  'bedrooms',
  'bathrooms',
  'parking_spots',
])

export function toPropertyTypeOption(value: unknown): string | undefined {
  return PROPERTY_TYPE_OPTIONS.some((option) => option.value === value)
    ? (value as string)
    : undefined
}

function toNumberParam(value: string, requireInteger: boolean): string | undefined {
  const text = value.trim()
  if (!text) return undefined

  const parsed = Number(text)
  if (!Number.isFinite(parsed) || parsed < 0) return undefined
  if (requireInteger && !Number.isInteger(parsed)) return undefined

  return String(parsed)
}

function toParamValue(
  key: FilterParamKey,
  value: string,
): string | undefined {
  if (key === 'transaction_type') return toTransactionType(value.trim())
  if (key === 'property_type') return toPropertyTypeOption(value.trim())
  if (DECIMAL_KEYS.has(key)) return toNumberParam(value, false)
  if (INTEGER_KEYS.has(key)) return toNumberParam(value, true)

  const text = value.trim()
  return text ? text : undefined
}

function withoutFilterParams(currentQuery: string): URLSearchParams {
  const params = new URLSearchParams(currentQuery)

  params.delete('page')
  for (const key of FILTER_PARAM_KEYS) {
    params.delete(key)
  }

  return params
}

function toHref(params: URLSearchParams): string {
  const query = params.toString()
  return query ? `${SEARCH_RESULTS_PATH}?${query}` : SEARCH_RESULTS_PATH
}

export function buildFilterUrl(
  values: FilterPanelValues,
  currentQuery = '',
): string {
  const params = withoutFilterParams(currentQuery)

  for (const key of FILTER_PARAM_KEYS) {
    const raw = values[key]
    if (raw === undefined) continue

    const value = toParamValue(key, raw)
    if (value !== undefined) params.append(key, value)
  }

  return toHref(params)
}

export function clearFilterUrl(currentQuery = ''): string {
  return toHref(withoutFilterParams(currentQuery))
}
