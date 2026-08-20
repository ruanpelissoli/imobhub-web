import type { Property, SearchFilters } from '@/lib/types'

export const FEATURED_LIMIT = 6

// Compartilhado pelos quatro estados da seção (carregando, erro, vazio, com
// resultados): o <h2> precisa ser idêntico nos quatro para não haver layout shift.
export const FEATURED_SECTION_TITLE = 'Imóveis em destaque'

// `sort: 'recent'` é premissa: o contrato da imobhub-api não enumera os valores
// de `sort`. Este é o ponto único de ajuste quando o contrato for conhecido.
export const FEATURED_FILTERS: SearchFilters = {
  per_page: FEATURED_LIMIT,
  sort: 'recent',
}

export function takeFeatured(
  data: Property[] | null | undefined,
): Property[] {
  if (!Array.isArray(data)) return []
  return data.slice(0, FEATURED_LIMIT)
}
