import { describe, expect, it } from 'vitest'
import { toDisplayParams } from './searchParams'

describe('toDisplayParams', () => {
  it('retorna lista vazia quando não há query params', () => {
    expect(toDisplayParams({})).toEqual([])
  })

  it('mantém os parâmetros conhecidos na ordem recebida', () => {
    expect(toDisplayParams({ cidade: 'curitiba', precoMax: '500000' })).toEqual([
      { key: 'cidade', value: 'curitiba' },
      { key: 'precoMax', value: '500000' },
    ])
  })

  it('preserva parâmetros desconhecidos em vez de rejeitá-los', () => {
    expect(toDisplayParams({ foo: 'bar' })).toEqual([{ key: 'foo', value: 'bar' }])
  })

  it('junta parâmetros repetidos em um único valor', () => {
    expect(toDisplayParams({ amenities: ['piscina', 'academia'] })).toEqual([
      { key: 'amenities', value: 'piscina, academia' },
    ])
  })

  it('descarta chaves com valor undefined', () => {
    expect(toDisplayParams({ cidade: 'curitiba', precoMax: undefined })).toEqual([
      { key: 'cidade', value: 'curitiba' },
    ])
  })

  it('mantém string vazia como valor válido', () => {
    expect(toDisplayParams({ cidade: '' })).toEqual([{ key: 'cidade', value: '' }])
  })

  it('representa array vazio como string vazia', () => {
    expect(toDisplayParams({ amenities: [] })).toEqual([
      { key: 'amenities', value: '' },
    ])
  })
})
