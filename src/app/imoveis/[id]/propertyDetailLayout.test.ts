import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8')

const detail = read('./propertyDetail.module.css')
const skeleton = read('../../../components/Skeleton/Skeleton.module.css')

const ruleOf = (css: string, selector: string) => {
  const match = css.match(
    new RegExp(`(?:^|[},])\\s*${selector}\\s*\\{([^}]*)\\}`, 'm'),
  )
  if (match === null) throw new Error(`regra ${selector} não encontrada`)
  return match[1]
}

const tabletBlockOf = (css: string) => {
  const match = css.match(
    /@media\s*\(\s*min-width:\s*48rem\s*\)\s*\{[\s\S]*?\n\}/,
  )
  if (match === null) throw new Error('bloco @media de 48rem não encontrado')
  return match[0]
}

const declarationOf = (rule: string, property: string) => {
  const match = rule.match(new RegExp(`(?:^|;)\\s*${property}\\s*:([^;}]+)`))
  return match === null ? null : match[1].trim()
}

const detailTablet = tabletBlockOf(detail)
const skeletonTablet = tabletBlockOf(skeleton)

describe('grid de atributos do detalhe', () => {
  it('usa 2 colunas com minmax(0, 1fr) até 767px', () => {
    expect(declarationOf(ruleOf(detail, '\\.attributes'), 'display')).toBe(
      'grid',
    )
    expect(
      declarationOf(ruleOf(detail, '\\.attributes'), 'grid-template-columns'),
    ).toBe('repeat(2, minmax(0, 1fr))')
  })

  it('vira 4 colunas com minmax(0, 1fr) a partir de 48rem', () => {
    expect(
      declarationOf(
        ruleOf(detailTablet, '\\.attributes'),
        'grid-template-columns',
      ),
    ).toBe('repeat(4, minmax(0, 1fr))')
  })

  it('mantém .amenities em flex-wrap, fora do grid', () => {
    const amenities = ruleOf(detail, '\\.amenities')
    expect(declarationOf(amenities, 'display')).toBe('flex')
    expect(declarationOf(amenities, 'flex-wrap')).toBe('wrap')
    expect(detailTablet).not.toMatch(/\.amenities/)
  })

  it('deixa o chip quebrar em vez de estourar a coluna a 375px', () => {
    expect(
      declarationOf(
        ruleOf(detail, '\\.attributes li,\\s*\\n\\.amenities li'),
        'overflow-wrap',
      ),
    ).toBe('anywhere')
  })
})

describe('paridade de chips entre o detalhe e o esqueleto', () => {
  const attributes = ruleOf(detail, '\\.attributes')
  const chips = ruleOf(skeleton, '\\.chips')

  it('desenha o mesmo grid em ambas as faixas', () => {
    expect(declarationOf(chips, 'display')).toBe('grid')
    expect(declarationOf(chips, 'grid-template-columns')).toBe(
      declarationOf(attributes, 'grid-template-columns'),
    )
    expect(
      declarationOf(ruleOf(skeletonTablet, '\\.chips'), 'grid-template-columns'),
    ).toBe(
      declarationOf(ruleOf(detailTablet, '\\.attributes'), 'grid-template-columns'),
    )
  })

  it('usa o mesmo gap', () => {
    expect(declarationOf(chips, 'gap')).toBe(declarationOf(attributes, 'gap'))
  })

  it('usa a mesma altura de chip', () => {
    expect(declarationOf(ruleOf(skeleton, '\\.chip'), 'height')).toBe(
      declarationOf(ruleOf(detail, '\\.attributes li'), 'min-height'),
    )
  })

  it('centra o texto do chip real na célula esticada pelo grid', () => {
    const attributeItem = ruleOf(detail, '\\.attributes li')
    expect(declarationOf(attributeItem, 'display')).toBe('flex')
    expect(declarationOf(attributeItem, 'align-items')).toBe('center')
  })
})

describe('alvos de toque e transbordo horizontal do detalhe', () => {
  it('mantém 44px de altura mínima nos alvos de toque', () => {
    for (const selector of [
      '\\.backLink',
      '\\.listingLink',
      '\\.retryButton',
      '\\.notFoundActions a',
    ]) {
      expect(declarationOf(ruleOf(detail, selector), 'min-height')).toBe('44px')
    }
  })

  it('não reduz o alvo do link de anúncio no modo linha de 48rem', () => {
    expect(declarationOf(ruleOf(detailTablet, '\\.listing'), 'padding-block')).toBe(
      'var(--space-1)',
    )
    expect(detailTablet).not.toMatch(/\.listingLink/)
  })

  it('protege os blocos de texto livre contra estouro a 375px', () => {
    for (const selector of [
      '\\.title',
      '\\.address',
      '\\.listing',
      '\\.description',
      '\\.errorMessage',
    ]) {
      expect(declarationOf(ruleOf(detail, selector), 'overflow-wrap')).toBe(
        'anywhere',
      )
    }

    for (const selector of [
      '\\.detail',
      '\\.header',
      '\\.section',
      '\\.listing',
    ]) {
      expect(declarationOf(ruleOf(detail, selector), 'min-width')).toBe('0')
    }
  })
})
