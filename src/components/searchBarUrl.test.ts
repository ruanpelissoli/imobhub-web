import { describe, expect, it } from 'vitest'
import { buildSearchUrl, toTransactionType } from './searchBarUrl'

describe('buildSearchUrl', () => {
  it('monta a URL com texto livre e tipo de transação', () => {
    expect(buildSearchUrl({ q: 'curitiba', transaction_type: 'sale' })).toBe(
      '/imoveis?q=curitiba&transaction_type=sale',
    )
  })

  it('usa transaction_type=rent quando "Alugar" está selecionado', () => {
    expect(buildSearchUrl({ q: 'curitiba', transaction_type: 'rent' })).toBe(
      '/imoveis?q=curitiba&transaction_type=rent',
    )
  })

  it('omite q quando o texto está vazio', () => {
    expect(buildSearchUrl({ q: '', transaction_type: 'sale' })).toBe(
      '/imoveis?transaction_type=sale',
    )
  })

  it('omite q quando o texto tem apenas espaços', () => {
    expect(buildSearchUrl({ q: '   ', transaction_type: 'sale' })).toBe(
      '/imoveis?transaction_type=sale',
    )
  })

  it('omite q quando o texto não é informado', () => {
    expect(buildSearchUrl({ transaction_type: 'rent' })).toBe(
      '/imoveis?transaction_type=rent',
    )
  })

  it('aplica trim nas pontas do texto', () => {
    expect(buildSearchUrl({ q: '  curitiba  ', transaction_type: 'sale' })).toBe(
      '/imoveis?q=curitiba&transaction_type=sale',
    )
  })

  it('encoda caracteres especiais', () => {
    expect(buildSearchUrl({ q: 'casa & cia', transaction_type: 'sale' })).toBe(
      '/imoveis?q=casa+%26+cia&transaction_type=sale',
    )
  })

  it('encoda acentos', () => {
    expect(buildSearchUrl({ q: 'água verde', transaction_type: 'sale' })).toBe(
      '/imoveis?q=%C3%A1gua+verde&transaction_type=sale',
    )
  })

  it('preserva o texto quando nenhum tipo de transação é informado', () => {
    expect(buildSearchUrl({ q: 'curitiba' })).toBe('/imoveis?q=curitiba')
  })

  it('retorna a rota sem query string quando não há nenhum filtro', () => {
    expect(buildSearchUrl({})).toBe('/imoveis')
  })
})

describe('toTransactionType', () => {
  it('aceita os valores do contrato da API', () => {
    expect(toTransactionType('sale')).toBe('sale')
    expect(toTransactionType('rent')).toBe('rent')
  })

  it('descarta valores fora do contrato', () => {
    expect(toTransactionType('comprar')).toBeUndefined()
    expect(toTransactionType('')).toBeUndefined()
    expect(toTransactionType(null)).toBeUndefined()
    expect(toTransactionType(undefined)).toBeUndefined()
  })
})
