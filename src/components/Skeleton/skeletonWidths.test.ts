import { describe, expect, it } from 'vitest'
import { resolveLineWidths } from './skeletonWidths'

describe('resolveLineWidths', () => {
  it('usa uma única linha de largura total quando lines é omitido', () => {
    expect(resolveLineWidths()).toEqual(['100%'])
  })

  it('encurta a última linha quando há mais de uma e nenhuma largura é dada', () => {
    expect(resolveLineWidths(3)).toEqual(['100%', '100%', '60%'])
  })

  it('aplica a mesma largura a todas as linhas quando width é string', () => {
    expect(resolveLineWidths(3, '12rem')).toEqual(['12rem', '12rem', '12rem'])
  })

  it('cicla as larguras quando o array é menor que lines', () => {
    expect(resolveLineWidths(5, ['100%', '70%'])).toEqual([
      '100%',
      '70%',
      '100%',
      '70%',
      '100%',
    ])
  })

  it('ignora o excedente quando o array é maior que lines', () => {
    expect(resolveLineWidths(2, ['100%', '70%', '40%', '20%'])).toEqual([
      '100%',
      '70%',
    ])
  })

  it('cai no padrão quando o array é vazio ou só tem entradas em branco', () => {
    expect(resolveLineWidths(2, [])).toEqual(['100%', '60%'])
    expect(resolveLineWidths(2, ['', '   '])).toEqual(['100%', '60%'])
  })

  it('cai no padrão quando width é string em branco', () => {
    expect(resolveLineWidths(2, '   ')).toEqual(['100%', '60%'])
  })

  it('aplica trim nas larguras informadas', () => {
    expect(resolveLineWidths(1, ' 8rem ')).toEqual(['8rem'])
    expect(resolveLineWidths(2, [' 8rem ', '', ' 4rem'])).toEqual([
      '8rem',
      '4rem',
    ])
  })

  it('retorna lista vazia para lines zero ou negativo', () => {
    expect(resolveLineWidths(0)).toEqual([])
    expect(resolveLineWidths(-3)).toEqual([])
  })

  it('retorna lista vazia para lines fracionário ou não finito', () => {
    expect(resolveLineWidths(2.5)).toEqual([])
    expect(resolveLineWidths(Number.NaN)).toEqual([])
    expect(resolveLineWidths(Number.POSITIVE_INFINITY)).toEqual([])
  })
})
