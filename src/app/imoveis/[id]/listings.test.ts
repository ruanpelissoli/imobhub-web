import { describe, expect, it } from 'vitest'
import { PRICE_ON_REQUEST, formatPrice } from '@/lib/format'
import type { Listing } from '@/lib/types'
import { FALLBACK_AGENCY_NAME, toListingViews } from './listings'

const normalize = (value: string) => value.replace(/\s/g, ' ')

const listing = (overrides: Partial<Listing> = {}): Listing => ({
  id: 'listing-1',
  agency_name: 'Imobiliária Alfa',
  price: 500000,
  url: 'https://alfa.com.br/imovel/1',
  scraped_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('toListingViews', () => {
  it('devolve lista vazia quando não há anúncios', () => {
    expect(toListingViews(undefined)).toEqual([])
    expect(toListingViews(null)).toEqual([])
    expect(toListingViews([])).toEqual([])
  })

  it('ordena por preço crescente', () => {
    const views = toListingViews([
      listing({ id: 'c', agency_name: 'Gama', price: 900000 }),
      listing({ id: 'a', agency_name: 'Alfa', price: 700000 }),
      listing({ id: 'b', agency_name: 'Beta', price: 850000 }),
    ])

    expect(views.map((view) => view.agencyName)).toEqual([
      'Alfa',
      'Beta',
      'Gama',
    ])
  })

  it('joga anúncios sem preço válido para o fim preservando a ordem original', () => {
    const views = toListingViews([
      listing({ agency_name: 'Sem preço', price: 0 }),
      listing({ agency_name: 'Nulo', price: null as unknown as number }),
      listing({ agency_name: 'Caro', price: 900000 }),
      listing({ agency_name: 'Negativo', price: -10 }),
      listing({ agency_name: 'Barato', price: 100000 }),
      listing({ agency_name: 'NaN', price: Number.NaN }),
    ])

    expect(views.map((view) => view.agencyName)).toEqual([
      'Barato',
      'Caro',
      'Sem preço',
      'Nulo',
      'Negativo',
      'NaN',
    ])
  })

  it('mantém a ordem original entre anúncios de mesmo preço', () => {
    const views = toListingViews([
      listing({ agency_name: 'Primeira', price: 500000 }),
      listing({ agency_name: 'Segunda', price: 500000 }),
    ])

    expect(views.map((view) => view.agencyName)).toEqual([
      'Primeira',
      'Segunda',
    ])
  })

  it('formata o preço em BRL', () => {
    const [view] = toListingViews([listing({ price: 750000 })])

    expect(normalize(view.price)).toBe(normalize(formatPrice(750000)))
    expect(normalize(view.price)).toBe('R$ 750.000')
  })

  it('exibe o anúncio com preço sob consulta quando o preço é inválido', () => {
    const views = toListingViews([
      listing({ price: 0 }),
      listing({ price: undefined as unknown as number }),
    ])

    expect(views).toHaveLength(2)
    expect(views.map((view) => view.price)).toEqual([
      PRICE_ON_REQUEST,
      PRICE_ON_REQUEST,
    ])
  })

  it('usa o fallback quando o nome da imobiliária é vazio, nulo ou só espaços', () => {
    const views = toListingViews([
      listing({ agency_name: '' }),
      listing({ agency_name: '   ' }),
      listing({ agency_name: null as unknown as string }),
    ])

    expect(views.map((view) => view.agencyName)).toEqual([
      FALLBACK_AGENCY_NAME,
      FALLBACK_AGENCY_NAME,
      FALLBACK_AGENCY_NAME,
    ])
  })

  it('aplica trim no nome da imobiliária', () => {
    const [view] = toListingViews([listing({ agency_name: '  Alfa  ' })])

    expect(view.agencyName).toBe('Alfa')
  })

  it('preserva urls http e https', () => {
    const views = toListingViews([
      listing({ url: 'http://alfa.com.br/1', price: 100 }),
      listing({ url: '  https://beta.com.br/2  ', price: 200 }),
    ])

    expect(views.map((view) => view.url)).toEqual([
      'http://alfa.com.br/1',
      'https://beta.com.br/2',
    ])
  })

  it('descarta urls ausentes, vazias ou fora de http(s)', () => {
    const views = toListingViews([
      listing({ url: '' }),
      listing({ url: '   ' }),
      listing({ url: null as unknown as string }),
      listing({ url: 'javascript:alert(1)' }),
      listing({ url: 'ftp://alfa.com.br/1' }),
      listing({ url: '/imoveis/1' }),
    ])

    expect(views.every((view) => view.url === null)).toBe(true)
  })

  it('monta o rótulo acessível com o nome da imobiliária', () => {
    const [comNome, semNome] = toListingViews([
      listing({ agency_name: 'Alfa', price: 100 }),
      listing({ agency_name: '', price: 200 }),
    ])

    expect(comNome.linkLabel).toBe('Ver anúncio original de Alfa')
    expect(semNome.linkLabel).toBe(
      `Ver anúncio original de ${FALLBACK_AGENCY_NAME}`,
    )
  })

  it('gera keys únicas mesmo com id repetido ou ausente', () => {
    const views = toListingViews([
      listing({ id: 'mesmo', price: 100 }),
      listing({ id: 'mesmo', price: 200 }),
      listing({ id: undefined as unknown as string, price: 300 }),
      listing({ id: undefined as unknown as string, price: 400 }),
    ])

    expect(new Set(views.map((view) => view.key)).size).toBe(4)
  })

  it('tolera entradas nulas dentro da lista', () => {
    const views = toListingViews([null, listing({ agency_name: 'Alfa' })])

    expect(views).toHaveLength(2)
    expect(views[0].agencyName).toBe('Alfa')
    expect(views[1].agencyName).toBe(FALLBACK_AGENCY_NAME)
  })
})
