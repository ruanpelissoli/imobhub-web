import { describe, expect, it } from 'vitest'
import type { Property } from '@/lib/types'
import { FEATURED_FILTERS, FEATURED_LIMIT, takeFeatured } from './featuredFilters'

const buildProperty = (id: string): Property => ({
  id,
  title: `Imóvel ${id}`,
  address: 'Rua das Flores, 100',
  neighborhood: 'Centro',
  city: 'Curitiba',
  price: 500000,
  area: 80,
  bedrooms: 2,
  bathrooms: 1,
  parking_spots: 1,
  created_at: '2026-01-01T00:00:00Z',
})

const buildList = (size: number) =>
  Array.from({ length: size }, (_, index) => buildProperty(String(index + 1)))

describe('FEATURED_FILTERS', () => {
  it('pede seis imóveis ordenados pelos mais recentes', () => {
    expect(FEATURED_LIMIT).toBe(6)
    expect(FEATURED_FILTERS).toEqual({ per_page: 6, sort: 'recent' })
  })
})

describe('takeFeatured', () => {
  it('corta a lista no limite quando a API devolve mais itens que o pedido', () => {
    const result = takeFeatured(buildList(8))
    expect(result).toHaveLength(FEATURED_LIMIT)
    expect(result.map((property) => property.id)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ])
  })

  it('mantém a lista intacta quando ela é menor que o limite', () => {
    const list = buildList(3)
    expect(takeFeatured(list)).toEqual(list)
  })

  it('devolve lista vazia para lista vazia', () => {
    expect(takeFeatured([])).toEqual([])
  })

  it('devolve lista vazia quando os dados são nulos ou ausentes', () => {
    expect(takeFeatured(null)).toEqual([])
    expect(takeFeatured(undefined)).toEqual([])
  })

  it('devolve lista vazia quando os dados não são um array', () => {
    expect(takeFeatured({ length: 2 } as unknown as Property[])).toEqual([])
  })
})
