import { describe, expect, it } from 'vitest'
import {
  buildAttributes,
  formatArea,
  formatLocation,
  formatPrice,
  getPrimaryPhoto,
  PRICE_ON_REQUEST,
  type PropertyAttributesInput,
} from './propertyCard.format'

const normalize = (value: string) => value.replace(/\s/g, ' ')

const baseAttributes: PropertyAttributesInput = {
  bedrooms: 0,
  bathrooms: 0,
  parking_spots: 0,
  area: 0,
}

describe('formatPrice', () => {
  it('formata preço inteiro em BRL sem centavos', () => {
    expect(normalize(formatPrice(850000))).toBe('R$ 850.000')
  })

  it('arredonda preço com centavos para o real mais próximo', () => {
    expect(normalize(formatPrice(1234.56))).toBe('R$ 1.235')
  })

  it('exibe "Preço sob consulta" quando o preço é zero', () => {
    expect(formatPrice(0)).toBe(PRICE_ON_REQUEST)
  })

  it('exibe "Preço sob consulta" quando o preço é negativo', () => {
    expect(formatPrice(-100)).toBe(PRICE_ON_REQUEST)
  })

  it('exibe "Preço sob consulta" quando o preço não é um número finito', () => {
    expect(formatPrice(Number.NaN)).toBe(PRICE_ON_REQUEST)
    expect(formatPrice(Number.POSITIVE_INFINITY)).toBe(PRICE_ON_REQUEST)
    expect(formatPrice(null as unknown as number)).toBe(PRICE_ON_REQUEST)
  })
})

describe('formatArea', () => {
  it('formata a área com o sufixo m²', () => {
    expect(formatArea(120)).toBe('120 m²')
  })

  it('usa separador de milhar pt-BR em áreas grandes', () => {
    expect(normalize(formatArea(1200) ?? '')).toBe('1.200 m²')
  })

  it('retorna null quando a área é zero', () => {
    expect(formatArea(0)).toBeNull()
  })

  it('retorna null quando a área é ausente ou inválida', () => {
    expect(formatArea(undefined as unknown as number)).toBeNull()
    expect(formatArea(Number.NaN)).toBeNull()
    expect(formatArea(-50)).toBeNull()
  })
})

describe('formatLocation', () => {
  it('une bairro e cidade com separador', () => {
    expect(formatLocation('Batel', 'Curitiba')).toBe('Batel · Curitiba')
  })

  it('omite a parte vazia em vez de deixar separador solto', () => {
    expect(formatLocation('', 'Curitiba')).toBe('Curitiba')
    expect(formatLocation('Batel', '   ')).toBe('Batel')
  })

  it('retorna string vazia quando não há bairro nem cidade', () => {
    expect(formatLocation('', '')).toBe('')
  })
})

describe('buildAttributes', () => {
  it('monta quartos, banheiros, vagas e área na ordem esperada', () => {
    expect(
      buildAttributes({ bedrooms: 3, bathrooms: 2, parking_spots: 2, area: 120 }),
    ).toEqual([
      { key: 'bedrooms', label: '3 quartos' },
      { key: 'bathrooms', label: '2 banheiros' },
      { key: 'parking_spots', label: '2 vagas' },
      { key: 'area', label: '120 m²' },
    ])
  })

  it('usa singular quando o valor é 1', () => {
    expect(
      buildAttributes({ bedrooms: 1, bathrooms: 1, parking_spots: 1, area: 0 }),
    ).toEqual([
      { key: 'bedrooms', label: '1 quarto' },
      { key: 'bathrooms', label: '1 banheiro' },
      { key: 'parking_spots', label: '1 vaga' },
    ])
  })

  it('omite atributos com valor zero', () => {
    expect(
      buildAttributes({ ...baseAttributes, bedrooms: 2, area: 80 }),
    ).toEqual([
      { key: 'bedrooms', label: '2 quartos' },
      { key: 'area', label: '80 m²' },
    ])
  })

  it('omite atributos nulos ou não numéricos vindos da API', () => {
    expect(
      buildAttributes({
        bedrooms: null as unknown as number,
        bathrooms: Number.NaN,
        parking_spots: undefined as unknown as number,
        area: 90,
      }),
    ).toEqual([{ key: 'area', label: '90 m²' }])
  })

  it('retorna lista vazia quando todos os atributos são omitidos', () => {
    expect(buildAttributes(baseAttributes)).toEqual([])
  })
})

describe('getPrimaryPhoto', () => {
  it('retorna a primeira foto disponível', () => {
    expect(getPrimaryPhoto(['https://cdn.example.com/a.jpg', 'b.jpg'])).toBe(
      'https://cdn.example.com/a.jpg',
    )
  })

  it('remove espaços em volta da URL', () => {
    expect(getPrimaryPhoto(['  https://cdn.example.com/a.jpg  '])).toBe(
      'https://cdn.example.com/a.jpg',
    )
  })

  it('ignora entradas vazias e usa a primeira válida', () => {
    expect(getPrimaryPhoto(['', '   ', 'https://cdn.example.com/b.jpg'])).toBe(
      'https://cdn.example.com/b.jpg',
    )
  })

  it('retorna null quando photos é null, undefined ou vazio', () => {
    expect(getPrimaryPhoto(null)).toBeNull()
    expect(getPrimaryPhoto(undefined)).toBeNull()
    expect(getPrimaryPhoto([])).toBeNull()
  })

  it('retorna null quando todas as entradas são vazias', () => {
    expect(getPrimaryPhoto(['', '  '])).toBeNull()
  })
})
