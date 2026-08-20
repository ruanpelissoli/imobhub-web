import { describe, expect, it } from 'vitest'
import { resolveColumnCount } from './skeletonTable'

describe('resolveColumnCount', () => {
  it('usa três colunas quando columns é omitido', () => {
    expect(resolveColumnCount()).toBe(3)
  })

  it('preserva a contagem informada', () => {
    expect(resolveColumnCount(1)).toBe(1)
    expect(resolveColumnCount(6)).toBe(6)
  })

  it('cai no default para zero e negativos', () => {
    expect(resolveColumnCount(0)).toBe(3)
    expect(resolveColumnCount(-2)).toBe(3)
  })

  it('cai no default para fracionário e não finito', () => {
    expect(resolveColumnCount(2.5)).toBe(3)
    expect(resolveColumnCount(Number.NaN)).toBe(3)
    expect(resolveColumnCount(Number.POSITIVE_INFINITY)).toBe(3)
  })
})
