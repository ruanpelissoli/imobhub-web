import type { TransactionType } from '@/lib/types'

export const SEARCH_RESULTS_PATH = '/imoveis'

export interface SearchBarValues {
  q?: string
  transaction_type?: TransactionType
}

export function toTransactionType(value: unknown): TransactionType | undefined {
  return value === 'sale' || value === 'rent' ? value : undefined
}

export function buildSearchUrl({ q, transaction_type }: SearchBarValues): string {
  const params = new URLSearchParams()

  const trimmedQuery = q?.trim()
  if (trimmedQuery) params.set('q', trimmedQuery)

  if (transaction_type) params.set('transaction_type', transaction_type)

  const query = params.toString()
  return query ? `${SEARCH_RESULTS_PATH}?${query}` : SEARCH_RESULTS_PATH
}
