import { describe, expect, it } from 'vitest'
import {
  FALLBACK_TITLE,
  PRICE_UNAVAILABLE,
  formatAddress,
  formatArea,
  formatAttributes,
  formatCount,
  formatDescription,
  formatPrice,
  formatTitle,
  toAmenityList,
} from './format'

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

describe('formatPrice', () => {
  it('formata o valor em BRL com locale pt-BR', () => {
    expect(formatPrice(750000)).toBe(brl.format(750000))
  })

  it('formata preço zero em vez de omitir', () => {
    expect(formatPrice(0)).toBe(brl.format(0))
  })

  it('preserva centavos', () => {
    expect(formatPrice(1234.56)).toBe(brl.format(1234.56))
  })

  it('usa o texto de indisponível quando o preço é ausente', () => {
    expect(formatPrice(null)).toBe(PRICE_UNAVAILABLE)
    expect(formatPrice(undefined)).toBe(PRICE_UNAVAILABLE)
  })

  it('usa o texto de indisponível para valores inválidos', () => {
    expect(formatPrice(Number.NaN)).toBe(PRICE_UNAVAILABLE)
    expect(formatPrice(Number.POSITIVE_INFINITY)).toBe(PRICE_UNAVAILABLE)
    expect(formatPrice(-1)).toBe(PRICE_UNAVAILABLE)
  })
})

describe('formatArea', () => {
  it('acrescenta a unidade m²', () => {
    expect(formatArea(120)).toBe('120 m²')
  })

  it('formata decimais no padrão pt-BR', () => {
    expect(formatArea(85.5)).toBe('85,5 m²')
  })

  it('retorna null quando a área é ausente, zero ou inválida', () => {
    expect(formatArea(null)).toBeNull()
    expect(formatArea(undefined)).toBeNull()
    expect(formatArea(0)).toBeNull()
    expect(formatArea(-10)).toBeNull()
    expect(formatArea(Number.NaN)).toBeNull()
  })
})

describe('formatAddress', () => {
  it('junta logradouro, bairro e cidade com vírgula', () => {
    expect(
      formatAddress({
        address: 'Rua das Flores, 100',
        neighborhood: 'Água Verde',
        city: 'Curitiba',
      }),
    ).toBe('Rua das Flores, 100, Água Verde, Curitiba')
  })

  it('pula partes nulas sem deixar vírgula pendurada', () => {
    expect(
      formatAddress({ address: null, neighborhood: 'Centro', city: 'Curitiba' }),
    ).toBe('Centro, Curitiba')
  })

  it('pula partes vazias ou só com espaços', () => {
    expect(
      formatAddress({ address: '  ', neighborhood: '', city: 'Curitiba' }),
    ).toBe('Curitiba')
  })

  it('aplica trim nas partes', () => {
    expect(formatAddress({ address: '  Rua A  ', city: ' Curitiba ' })).toBe(
      'Rua A, Curitiba',
    )
  })

  it('retorna null quando nenhuma parte está disponível', () => {
    expect(formatAddress({})).toBeNull()
    expect(
      formatAddress({ address: null, neighborhood: null, city: null }),
    ).toBeNull()
  })
})

describe('formatCount', () => {
  it('usa o singular para 1', () => {
    expect(formatCount(1, 'quarto', 'quartos', 'Sem quartos')).toBe('1 quarto')
  })

  it('usa o plural acima de 1', () => {
    expect(formatCount(3, 'quarto', 'quartos', 'Sem quartos')).toBe('3 quartos')
  })

  it('usa o rótulo de zero', () => {
    expect(formatCount(0, 'vaga', 'vagas', 'Sem vagas')).toBe('Sem vagas')
  })

  it('retorna null quando o valor é ausente ou inválido', () => {
    expect(formatCount(null, 'vaga', 'vagas', 'Sem vagas')).toBeNull()
    expect(formatCount(undefined, 'vaga', 'vagas', 'Sem vagas')).toBeNull()
    expect(formatCount(Number.NaN, 'vaga', 'vagas', 'Sem vagas')).toBeNull()
    expect(formatCount(-1, 'vaga', 'vagas', 'Sem vagas')).toBeNull()
  })
})

describe('formatAttributes', () => {
  it('monta área, quartos, banheiros e vagas na ordem esperada', () => {
    expect(
      formatAttributes({
        area: 120,
        bedrooms: 3,
        bathrooms: 2,
        parking_spots: 1,
      }),
    ).toEqual([
      { key: 'area', text: '120 m²' },
      { key: 'bedrooms', text: '3 quartos' },
      { key: 'bathrooms', text: '2 banheiros' },
      { key: 'parking_spots', text: '1 vaga' },
    ])
  })

  it('mantém os atributos zerados com rótulo próprio', () => {
    expect(
      formatAttributes({
        area: 40,
        bedrooms: 0,
        bathrooms: 1,
        parking_spots: 0,
      }),
    ).toEqual([
      { key: 'area', text: '40 m²' },
      { key: 'bedrooms', text: 'Sem quartos' },
      { key: 'bathrooms', text: '1 banheiro' },
      { key: 'parking_spots', text: 'Sem vagas' },
    ])
  })

  it('omite os atributos ausentes', () => {
    expect(
      formatAttributes({
        area: null,
        bedrooms: 2,
        bathrooms: null,
        parking_spots: undefined,
      }),
    ).toEqual([{ key: 'bedrooms', text: '2 quartos' }])
  })

  it('retorna lista vazia quando nenhum atributo está disponível', () => {
    expect(formatAttributes({})).toEqual([])
  })
})

describe('formatTitle', () => {
  it('preserva o título informado', () => {
    expect(formatTitle('Apartamento no Batel')).toBe('Apartamento no Batel')
  })

  it('aplica trim', () => {
    expect(formatTitle('  Casa  ')).toBe('Casa')
  })

  it('cai no fallback quando o título é ausente ou vazio', () => {
    expect(formatTitle(null)).toBe(FALLBACK_TITLE)
    expect(formatTitle(undefined)).toBe(FALLBACK_TITLE)
    expect(formatTitle('   ')).toBe(FALLBACK_TITLE)
  })
})

describe('toAmenityList', () => {
  it('preserva a lista informada', () => {
    expect(toAmenityList(['Piscina', 'Academia'])).toEqual([
      'Piscina',
      'Academia',
    ])
  })

  it('descarta entradas vazias e aplica trim', () => {
    expect(toAmenityList([' Piscina ', '', '   '])).toEqual(['Piscina'])
  })

  it('remove duplicatas mantendo a primeira ocorrência', () => {
    expect(toAmenityList(['Piscina', 'Piscina', 'Churrasqueira'])).toEqual([
      'Piscina',
      'Churrasqueira',
    ])
  })

  it('retorna lista vazia quando ausente ou nula', () => {
    expect(toAmenityList(null)).toEqual([])
    expect(toAmenityList(undefined)).toEqual([])
    expect(toAmenityList([])).toEqual([])
  })
})

describe('formatDescription', () => {
  it('preserva a descrição com trim', () => {
    expect(formatDescription('  Imóvel reformado.  ')).toBe(
      'Imóvel reformado.',
    )
  })

  it('retorna null quando ausente, nula ou só espaços', () => {
    expect(formatDescription(null)).toBeNull()
    expect(formatDescription(undefined)).toBeNull()
    expect(formatDescription('   ')).toBeNull()
  })
})
