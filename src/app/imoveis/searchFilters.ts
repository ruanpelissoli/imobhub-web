import { SEARCH_RESULTS_PATH, toTransactionType } from '@/components/searchBarUrl'
import type { SearchFilters } from '@/lib/types'

export type RawSearchParams = Record<string, string | string[] | undefined>

export interface Pagination {
  currentPage: number
  totalPages: number
  previousHref: string | null
  nextHref: string | null
  isVisible: boolean
}

const TEXT_KEYS = ['q', 'property_type', 'city', 'neighborhood'] as const
const DECIMAL_KEYS = ['min_price', 'max_price', 'min_area'] as const
const INTEGER_KEYS = ['bedrooms', 'bathrooms', 'parking_spots'] as const

const resultCountFormatter = new Intl.NumberFormat('pt-BR')

export function firstValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function toTextFilter(
  value: string | string[] | undefined,
): string | undefined {
  const text = firstValue(value)?.trim()
  return text ? text : undefined
}

export function toNumberFilter(
  value: string | string[] | undefined,
): number | undefined {
  const text = toTextFilter(value)
  if (text === undefined) return undefined

  const parsed = Number(text)
  if (!Number.isFinite(parsed) || parsed < 0) return undefined

  return parsed
}

export function toIntegerFilter(
  value: string | string[] | undefined,
): number | undefined {
  const parsed = toNumberFilter(value)
  return parsed !== undefined && Number.isInteger(parsed) ? parsed : undefined
}

export function toPageNumber(value: string | string[] | undefined): number {
  const page = toIntegerFilter(value)
  return page !== undefined && page >= 1 ? page : 1
}

export function parseSearchFilters(raw: RawSearchParams): SearchFilters {
  const filters: SearchFilters = { page: toPageNumber(raw.page) }

  for (const key of TEXT_KEYS) {
    const value = toTextFilter(raw[key])
    if (value !== undefined) filters[key] = value
  }

  for (const key of DECIMAL_KEYS) {
    const value = toNumberFilter(raw[key])
    if (value !== undefined) filters[key] = value
  }

  for (const key of INTEGER_KEYS) {
    const value = toIntegerFilter(raw[key])
    if (value !== undefined) filters[key] = value
  }

  const transactionType = toTransactionType(firstValue(raw.transaction_type))
  if (transactionType) filters.transaction_type = transactionType

  return filters
}

export function toSearchParams(raw: RawSearchParams): URLSearchParams {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue

    for (const item of Array.isArray(value) ? value : [value]) {
      params.append(key, item)
    }
  }

  return params
}

export function buildPageHref(raw: RawSearchParams, page: number): string {
  const params = toSearchParams(raw)

  params.delete('page')
  params.append('page', String(page))

  return `${SEARCH_RESULTS_PATH}?${params.toString()}`
}

export function buildPagination(
  raw: RawSearchParams,
  currentPage: number,
  totalPages: number,
): Pagination {
  return {
    currentPage,
    totalPages,
    previousHref: currentPage > 1 ? buildPageHref(raw, currentPage - 1) : null,
    nextHref:
      currentPage < totalPages ? buildPageHref(raw, currentPage + 1) : null,
    isVisible: totalPages > 1,
  }
}

export function formatResultCount(total: number): string {
  const safeTotal =
    Number.isFinite(total) && total > 0 ? Math.trunc(total) : 0
  const formatted = resultCountFormatter.format(safeTotal)

  return safeTotal === 1
    ? `${formatted} imóvel encontrado`
    : `${formatted} imóveis encontrados`
}
