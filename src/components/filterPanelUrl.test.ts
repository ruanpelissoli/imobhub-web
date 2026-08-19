import { describe, expect, it } from 'vitest'
import {
  buildFilterUrl,
  clearFilterUrl,
  PROPERTY_TYPE_OPTIONS,
  toPropertyTypeOption,
} from './filterPanelUrl'

describe('buildFilterUrl', () => {
  it('monta a URL com todos os filtros preenchidos', () => {
    expect(
      buildFilterUrl({
        transaction_type: 'sale',
        property_type: 'apartamento',
        min_price: '250000',
        max_price: '900000',
        bedrooms: '3',
        bathrooms: '2',
        parking_spots: '1',
        min_area: '65',
        city: 'Curitiba',
        neighborhood: 'Batel',
      }),
    ).toBe(
      '/imoveis?transaction_type=sale&property_type=apartamento&min_price=250000&max_price=900000&bedrooms=3&bathrooms=2&parking_spots=1&min_area=65&city=Curitiba&neighborhood=Batel',
    )
  })

  it('omite campo vazio ou só com espaços', () => {
    expect(
      buildFilterUrl({
        transaction_type: '',
        property_type: '',
        min_price: '',
        city: '   ',
        neighborhood: '',
      }),
    ).toBe('/imoveis')
  })

  it('aplica trim no texto que vira param', () => {
    expect(buildFilterUrl({ city: '  Curitiba  ' })).toBe('/imoveis?city=Curitiba')
  })

  it('omite valor numérico não numérico', () => {
    expect(buildFilterUrl({ min_price: 'abc', bedrooms: 'dois' })).toBe('/imoveis')
  })

  it('omite valor numérico negativo', () => {
    expect(buildFilterUrl({ min_price: '-1', bathrooms: '-3' })).toBe('/imoveis')
  })

  it('omite valor fracionário onde o campo é de contagem', () => {
    expect(buildFilterUrl({ bedrooms: '1.5' })).toBe('/imoveis')
    expect(buildFilterUrl({ min_area: '65.5' })).toBe('/imoveis?min_area=65.5')
  })

  it('preserva zero como valor válido', () => {
    expect(buildFilterUrl({ parking_spots: '0' })).toBe('/imoveis?parking_spots=0')
    expect(buildFilterUrl({ min_price: '0' })).toBe('/imoveis?min_price=0')
  })

  it('descarta transaction_type fora do contrato', () => {
    expect(buildFilterUrl({ transaction_type: 'xyz' })).toBe('/imoveis')
  })

  it('descarta property_type fora da lista de opções', () => {
    expect(buildFilterUrl({ property_type: 'castelo' })).toBe('/imoveis')
  })

  it('reseta a paginação: page da query corrente não sobrevive', () => {
    expect(buildFilterUrl({ bedrooms: '2' }, 'page=7')).toBe('/imoveis?bedrooms=2')
  })

  it('reescreve os filtros vigentes a partir do formulário', () => {
    expect(
      buildFilterUrl({ bedrooms: '2' }, 'bedrooms=4&city=Curitiba&page=3'),
    ).toBe('/imoveis?bedrooms=2')
  })

  it('preserva q e params desconhecidos', () => {
    expect(buildFilterUrl({ bedrooms: '2' }, 'q=casa&foo=bar')).toBe(
      '/imoveis?q=casa&foo=bar&bedrooms=2',
    )
  })

  it('preserva params desconhecidos repetidos', () => {
    expect(
      buildFilterUrl({}, 'amenities=piscina&amenities=academia'),
    ).toBe('/imoveis?amenities=piscina&amenities=academia')
  })

  it('retorna a rota sem query string quando não há nenhum filtro', () => {
    expect(buildFilterUrl({})).toBe('/imoveis')
    expect(buildFilterUrl({}, 'page=2&bedrooms=3')).toBe('/imoveis')
  })

  it('codifica espaço como + e acento como percent-encoding', () => {
    expect(buildFilterUrl({ city: 'sao jose' })).toBe('/imoveis?city=sao+jose')
    expect(buildFilterUrl({ neighborhood: 'Água Verde' })).toBe(
      '/imoveis?neighborhood=%C3%81gua+Verde',
    )
  })

  it('não bloqueia min_price maior que max_price', () => {
    expect(buildFilterUrl({ min_price: '900000', max_price: '100000' })).toBe(
      '/imoveis?min_price=900000&max_price=100000',
    )
  })
})

describe('clearFilterUrl', () => {
  it('remove todos os params do painel e a paginação', () => {
    expect(
      clearFilterUrl(
        'transaction_type=sale&property_type=casa&min_price=1&max_price=2&bedrooms=3&bathrooms=2&parking_spots=1&min_area=50&city=Curitiba&neighborhood=Batel&page=4',
      ),
    ).toBe('/imoveis')
  })

  it('preserva q e params desconhecidos', () => {
    expect(clearFilterUrl('q=casa&bedrooms=3&foo=bar&page=2')).toBe(
      '/imoveis?q=casa&foo=bar',
    )
  })

  it('retorna a rota sem query string quando não há nada a preservar', () => {
    expect(clearFilterUrl('')).toBe('/imoveis')
  })
})

describe('toPropertyTypeOption', () => {
  it('aceita os valores da lista de opções', () => {
    for (const { value } of PROPERTY_TYPE_OPTIONS) {
      expect(toPropertyTypeOption(value)).toBe(value)
    }
  })

  it('descarta valor fora da lista', () => {
    expect(toPropertyTypeOption('castelo')).toBeUndefined()
    expect(toPropertyTypeOption('')).toBeUndefined()
    expect(toPropertyTypeOption(undefined)).toBeUndefined()
    expect(toPropertyTypeOption(null)).toBeUndefined()
  })
})
