import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8')

const tokens = read('./tokens.css')

const stylesheets = [
  { name: 'src/app/globals.css', css: read('./globals.css'), literalFree: true },
  {
    name: 'src/app/home.module.css',
    css: read('./home.module.css'),
    literalFree: true,
  },
  {
    name: 'src/components/PropertyCard.module.css',
    css: read('../components/PropertyCard.module.css'),
    literalFree: true,
  },
  {
    name: 'src/components/PropertyGallery.module.css',
    css: read('../components/PropertyGallery.module.css'),
    literalFree: true,
  },
  {
    name: 'src/components/Skeleton/Skeleton.module.css',
    css: read('../components/Skeleton/Skeleton.module.css'),
    literalFree: true,
  },
  {
    name: 'src/components/ui/EmptyState/EmptyState.module.css',
    css: read('../components/ui/EmptyState/EmptyState.module.css'),
    literalFree: true,
  },
  {
    name: 'src/components/ui/ErrorMessage/ErrorMessage.module.css',
    css: read('../components/ui/ErrorMessage/ErrorMessage.module.css'),
    literalFree: true,
  },
  {
    name: 'src/components/FilterPanel.module.css',
    css: read('../components/FilterPanel.module.css'),
    literalFree: false,
  },
  {
    name: 'src/app/imoveis/page.module.css',
    css: read('./imoveis/page.module.css'),
    literalFree: false,
  },
  {
    name: 'src/app/imoveis/[id]/propertyDetail.module.css',
    css: read('./imoveis/[id]/propertyDetail.module.css'),
    literalFree: false,
  },
]

const consumers = stylesheets.filter((sheet) => sheet.literalFree)

const definedTokens = new Set(
  Array.from(tokens.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm), (match) => match[1]),
)

describe('tokens.css', () => {
  it('define todos os tokens de cor da identidade ImobHub', () => {
    for (const token of [
      '--color-primary',
      '--color-primary-dark',
      '--color-primary-soft',
      '--color-surface',
      '--color-surface-muted',
      '--color-text',
      '--color-text-strong',
      '--color-text-muted',
      '--color-text-subtle',
      '--color-border',
      '--color-border-strong',
      '--color-error',
      '--color-success',
    ]) {
      expect(definedTokens).toContain(token)
    }
  })

  it('define a escala tipográfica, de layout e de espaçamento', () => {
    for (const token of [
      '--font-sans',
      '--leading-body',
      '--text-xs',
      '--text-sm',
      '--text-base',
      '--text-lg',
      '--text-xl',
      '--text-2xl',
      '--radius-sm',
      '--radius-card',
      '--shadow-card',
      '--shadow-lg',
      '--space-1',
      '--space-2',
      '--space-3',
      '--space-4',
      '--space-5',
      '--space-6',
    ]) {
      expect(definedTokens).toContain(token)
    }
  })

  it('documenta a escala de breakpoints sem criar variáveis --bp-*', () => {
    expect(tokens).toMatch(/640px/)
    expect(tokens).toMatch(/1024px/)
    expect(tokens).toMatch(/1025px/)
    expect(tokens).not.toMatch(/^\s*--bp-/m)
  })

  it('mantém --color-error e --color-success acima de 4.5:1 sobre --color-surface', () => {
    const valueOf = (token: string) => {
      const match = tokens.match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})`))
      if (!match) throw new Error(`${token} não definido como hex de 6 dígitos`)
      return match[1]
    }

    const relativeLuminance = (hex: string) => {
      const channels = [1, 3, 5].map((offset) => {
        const value = parseInt(hex.slice(offset, offset + 2), 16) / 255
        return value <= 0.03928
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4
      })
      return (
        0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
      )
    }

    const contrast = (a: string, b: string) => {
      const [lighter, darker] = [
        relativeLuminance(a),
        relativeLuminance(b),
      ].sort((x, y) => y - x)
      return (lighter + 0.05) / (darker + 0.05)
    }

    const surface = valueOf('--color-surface')
    expect(contrast(valueOf('--color-error'), surface)).toBeGreaterThanOrEqual(
      4.5,
    )
    expect(
      contrast(valueOf('--color-success'), surface),
    ).toBeGreaterThanOrEqual(4.5)
  })
})

describe.each(consumers)('$name', ({ css }) => {
  it('não contém cor literal', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).not.toMatch(/\brgba?\(/)
    expect(css).not.toMatch(/\bhsla?\(/)
  })

  it('não contém stack de fonte literal', () => {
    expect(css).not.toMatch(/font-family:(?![^;]*var\(--font-)/)
  })

  it('não contém border-radius, box-shadow nem font-size literais', () => {
    for (const property of ['border-radius', 'box-shadow', 'font-size']) {
      const declarations = Array.from(
        css.matchAll(new RegExp(`${property}:([^;}]+)`, 'g')),
        (match) => match[1],
      )
      for (const declaration of declarations) {
        expect(declaration).toMatch(/var\(--/)
      }
    }
  })

})

describe('breakpoints da Home', () => {
  const globals = read('./globals.css')
  const home = read('./home.module.css')

  it('não usa mais a media query de 48rem fora da escala canônica', () => {
    expect(globals).not.toMatch(/48rem/)
    expect(home).not.toMatch(/48rem/)
  })

  it('vira a .search-bar para horizontal a partir de 641px', () => {
    const tabletBlock = globals.match(
      /@media\s*\(\s*min-width:\s*641px\s*\)\s*\{[\s\S]*?\n\}/,
    )
    expect(tabletBlock).not.toBeNull()
    expect(tabletBlock?.[0]).toMatch(/\.search-bar\s*\{[^}]*flex-direction:\s*row/)
  })

  it('mantém o grid de destaques em 1/2/3 colunas com minmax(0, 1fr)', () => {
    expect(home).toMatch(
      /@media\s*\(\s*min-width:\s*641px\s*\)\s*\{[\s\S]*?repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
    )
    expect(home).toMatch(
      /@media\s*\(\s*min-width:\s*1025px\s*\)\s*\{[\s\S]*?repeat\(3,\s*minmax\(0,\s*1fr\)\)/,
    )
    expect(home).not.toMatch(/grid-template-columns[^;]*repeat\(4/)
  })

  it('só usa breakpoints da escala canônica nos estilos da Home', () => {
    const breakpoints = [
      ...globals.matchAll(/@media[^{]*min-width:\s*([^)\s]+)/g),
      ...home.matchAll(/@media[^{]*min-width:\s*([^)\s]+)/g),
    ].map((match) => match[1])

    expect(breakpoints.length).toBeGreaterThan(0)
    for (const breakpoint of breakpoints) {
      expect(['641px', '1025px']).toContain(breakpoint)
    }
  })

  it('protege hero e alvos de toque da Home', () => {
    for (const selector of [
      '.page-title',
      '.home-hero__subtitle',
      '.search-bar__field',
      '.search-bar__transaction',
      '.search-bar__input',
    ]) {
      const rule = globals.match(
        new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`),
      )?.[1]
      expect(rule).toBeDefined()
      expect(rule).toMatch(/overflow-wrap:\s*anywhere|min-width:\s*0/)
    }

    for (const selector of [
      '.brand',
      '.search-bar__input',
      '.search-bar__option',
      '.search-bar__submit',
    ]) {
      const rule = globals.match(
        new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`),
      )?.[1]
      expect(rule).toMatch(/min-height:\s*44px/)
    }
  })
})

describe.each(stylesheets)('$name', ({ css }) => {
  it('só usa var(--x) de tokens definidos em tokens.css', () => {
    const used = Array.from(
      css.matchAll(/var\(\s*(--[a-z0-9-]+)/g),
      (match) => match[1],
    )
    expect(used.length).toBeGreaterThan(0)
    for (const token of used) {
      expect(definedTokens).toContain(token)
    }
  })
})
