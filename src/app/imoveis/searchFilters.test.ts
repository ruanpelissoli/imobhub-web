import { describe, expect, it } from 'vitest'
import {
  buildPageHref,
  buildPagination,
  formatResultCount,
  parseSearchFilters,
  toSearchParams,
} from './searchFilters'

describe('parseSearchFilters', () => {
  it('converte os params numéricos para number', () => {
    const filters = parseSearchFilters({
      min_price: '250000',
      max_price: '900000.5',
      min_area: '65',
      bedrooms: '3',
      bathrooms: '2',
      parking_spots: '1',
    })

    expect(filters).toEqual({
      page: 1,
      min_price: 250000,
      max_price: 900000.5,
      min_area: 65,
      bedrooms: 3,
      bathrooms: 2,
      parking_spots: 1,
    })
  })

  it('lê os params de texto com trim', () => {
    expect(
      parseSearchFilters({
        q: '  água verde  ',
        property_type: 'apartamento',
        city: 'Curitiba',
        neighborhood: 'Batel',
      }),
    ).toEqual({
      page: 1,
      q: 'água verde',
      property_type: 'apartamento',
      city: 'Curitiba',
      neighborhood: 'Batel',
    })
  })

  it('aceita os valores de transaction_type do contrato da API', () => {
    expect(parseSearchFilters({ transaction_type: 'sale' }).transaction_type).toBe(
      'sale',
    )
    expect(parseSearchFilters({ transaction_type: 'rent' }).transaction_type).toBe(
      'rent',
    )
  })

  it('descarta transaction_type fora do contrato', () => {
    expect(
      parseSearchFilters({ transaction_type: 'xyz' }).transaction_type,
    ).toBeUndefined()
  })

  it('descarta valor numérico não numérico', () => {
    expect(parseSearchFilters({ min_price: 'abc' }).min_price).toBeUndefined()
  })

  it('descarta valor numérico vazio em vez de virar zero', () => {
    expect(parseSearchFilters({ min_price: '' }).min_price).toBeUndefined()
    expect(parseSearchFilters({ min_price: '   ' }).min_price).toBeUndefined()
  })

  it('descarta valor numérico negativo', () => {
    expect(parseSearchFilters({ bedrooms: '-1' }).bedrooms).toBeUndefined()
    expect(parseSearchFilters({ min_price: '-10' }).min_price).toBeUndefined()
  })

  it('descarta valor fracionário onde o campo é de contagem', () => {
    expect(parseSearchFilters({ bedrooms: '1.5' }).bedrooms).toBeUndefined()
    expect(parseSearchFilters({ parking_spots: '2.5' }).parking_spots).toBeUndefined()
  })

  it('aceita zero como valor válido', () => {
    expect(parseSearchFilters({ bedrooms: '0' }).bedrooms).toBe(0)
    expect(parseSearchFilters({ min_price: '0' }).min_price).toBe(0)
  })

  it('descarta texto vazio', () => {
    expect(parseSearchFilters({ q: '   ', city: '' })).toEqual({ page: 1 })
  })

  it('usa a primeira ocorrência de um param repetido', () => {
    expect(
      parseSearchFilters({ city: ['Curitiba', 'São Paulo'], bedrooms: ['2', '4'] }),
    ).toEqual({ page: 1, city: 'Curitiba', bedrooms: 2 })
  })

  it('ignora params desconhecidos', () => {
    expect(parseSearchFilters({ foo: 'bar', q: 'casa' })).toEqual({
      page: 1,
      q: 'casa',
    })
  })

  it('busca sem filtros quando não há nenhum param', () => {
    expect(parseSearchFilters({})).toEqual({ page: 1 })
  })

  it('nunca envia per_page, sort nem amenities', () => {
    const filters = parseSearchFilters({
      per_page: '50',
      sort: 'price',
      amenities: ['piscina', 'academia'],
    })

    expect(filters).toEqual({ page: 1 })
  })

  it('lê a página quando o valor é válido', () => {
    expect(parseSearchFilters({ page: '3' }).page).toBe(3)
  })

  it('cai na página 1 quando page é inválido ou fora de faixa', () => {
    expect(parseSearchFilters({ page: 'abc' }).page).toBe(1)
    expect(parseSearchFilters({ page: '' }).page).toBe(1)
    expect(parseSearchFilters({ page: '0' }).page).toBe(1)
    expect(parseSearchFilters({ page: '-2' }).page).toBe(1)
    expect(parseSearchFilters({ page: '1.5' }).page).toBe(1)
  })
})

describe('toSearchParams', () => {
  it('preserva params repetidos', () => {
    expect(
      toSearchParams({ amenities: ['piscina', 'academia'] }).toString(),
    ).toBe('amenities=piscina&amenities=academia')
  })

  it('preserva page e params desconhecidos', () => {
    expect(toSearchParams({ q: 'casa', foo: 'bar', page: '3' }).toString()).toBe(
      'q=casa&foo=bar&page=3',
    )
  })

  it('ignora valor undefined', () => {
    expect(toSearchParams({ q: 'casa', city: undefined }).toString()).toBe(
      'q=casa',
    )
  })

  it('devolve query string vazia quando não há param', () => {
    expect(toSearchParams({}).toString()).toBe('')
  })
})

describe('buildPageHref', () => {
  it('preserva os demais params e troca somente page', () => {
    expect(
      buildPageHref({ q: 'curitiba', transaction_type: 'sale', page: '2' }, 3),
    ).toBe('/imoveis?q=curitiba&transaction_type=sale&page=3')
  })

  it('preserva params desconhecidos', () => {
    expect(buildPageHref({ q: 'casa', foo: 'bar' }, 2)).toBe(
      '/imoveis?q=casa&foo=bar&page=2',
    )
  })

  it('preserva params repetidos', () => {
    expect(buildPageHref({ amenities: ['piscina', 'academia'] }, 2)).toBe(
      '/imoveis?amenities=piscina&amenities=academia&page=2',
    )
  })

  it('adiciona page quando a URL não tinha o param', () => {
    expect(buildPageHref({}, 2)).toBe('/imoveis?page=2')
  })

  it('encoda caracteres especiais dos params preservados', () => {
    expect(buildPageHref({ q: 'água verde' }, 2)).toBe(
      '/imoveis?q=%C3%A1gua+verde&page=2',
    )
  })
})

describe('buildPagination', () => {
  it('oculta os controles quando há uma única página', () => {
    expect(buildPagination({}, 1, 1).isVisible).toBe(false)
  })

  it('oculta os controles quando não há resultado', () => {
    expect(buildPagination({}, 1, 0).isVisible).toBe(false)
  })

  it('não oferece "Anterior" na primeira página', () => {
    const pagination = buildPagination({ q: 'casa' }, 1, 7)

    expect(pagination.isVisible).toBe(true)
    expect(pagination.previousHref).toBeNull()
    expect(pagination.nextHref).toBe('/imoveis?q=casa&page=2')
  })

  it('não oferece "Próximo" na última página', () => {
    const pagination = buildPagination({ q: 'casa' }, 7, 7)

    expect(pagination.previousHref).toBe('/imoveis?q=casa&page=6')
    expect(pagination.nextHref).toBeNull()
  })

  it('não oferece "Próximo" quando a página passa do total', () => {
    expect(buildPagination({}, 9, 7).nextHref).toBeNull()
  })

  it('oferece os dois sentidos numa página do meio', () => {
    const pagination = buildPagination({ q: 'casa' }, 4, 7)

    expect(pagination.previousHref).toBe('/imoveis?q=casa&page=3')
    expect(pagination.nextHref).toBe('/imoveis?q=casa&page=5')
  })
})

describe('formatResultCount', () => {
  it('usa singular para um resultado', () => {
    expect(formatResultCount(1)).toBe('1 imóvel encontrado')
  })

  it('usa plural para mais de um resultado', () => {
    expect(formatResultCount(42)).toBe('42 imóveis encontrados')
  })

  it('usa plural para zero resultado', () => {
    expect(formatResultCount(0)).toBe('0 imóveis encontrados')
  })

  it('trata total ausente ou inválido como zero', () => {
    expect(formatResultCount(Number.NaN)).toBe('0 imóveis encontrados')
    expect(formatResultCount(-5)).toBe('0 imóveis encontrados')
  })

  it('agrupa milhares no formato pt-BR', () => {
    expect(formatResultCount(1234)).toBe('1.234 imóveis encontrados')
  })
})
