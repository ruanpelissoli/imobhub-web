import { describe, expect, it } from 'vitest'
import {
  nextPhotoIndex,
  normalizePhotoIndex,
  photoAlt,
  photoCounterLabel,
  prevPhotoIndex,
  toPhotoList,
} from './propertyGalleryState'

describe('toPhotoList', () => {
  it('preserva as URLs informadas', () => {
    expect(toPhotoList(['a.jpg', 'b.jpg'])).toEqual(['a.jpg', 'b.jpg'])
  })

  it('descarta entradas vazias e aplica trim', () => {
    expect(toPhotoList([' a.jpg ', '', '   '])).toEqual(['a.jpg'])
  })

  it('retorna lista vazia quando photos é nulo, ausente ou vazio', () => {
    expect(toPhotoList(null)).toEqual([])
    expect(toPhotoList(undefined)).toEqual([])
    expect(toPhotoList([])).toEqual([])
  })

  it('descarta entradas não-string vindas da API', () => {
    expect(toPhotoList([null, 'a.jpg'] as unknown as string[])).toEqual([
      'a.jpg',
    ])
  })
})

describe('nextPhotoIndex', () => {
  it('avança para a próxima foto', () => {
    expect(nextPhotoIndex(0, 3)).toBe(1)
    expect(nextPhotoIndex(1, 3)).toBe(2)
  })

  it('volta para a primeira foto ao passar da última', () => {
    expect(nextPhotoIndex(2, 3)).toBe(0)
  })

  it('permanece em zero com uma única foto', () => {
    expect(nextPhotoIndex(0, 1)).toBe(0)
  })

  it('permanece em zero sem fotos, sem NaN', () => {
    expect(nextPhotoIndex(0, 0)).toBe(0)
  })

  it('normaliza índice fora da faixa', () => {
    expect(nextPhotoIndex(9, 3)).toBe(1)
  })
})

describe('prevPhotoIndex', () => {
  it('retrocede para a foto anterior', () => {
    expect(prevPhotoIndex(2, 3)).toBe(1)
    expect(prevPhotoIndex(1, 3)).toBe(0)
  })

  it('vai para a última foto ao retroceder da primeira', () => {
    expect(prevPhotoIndex(0, 3)).toBe(2)
  })

  it('permanece em zero com uma única foto', () => {
    expect(prevPhotoIndex(0, 1)).toBe(0)
  })

  it('permanece em zero sem fotos, sem NaN', () => {
    expect(prevPhotoIndex(0, 0)).toBe(0)
  })

  it('normaliza índice fora da faixa', () => {
    expect(prevPhotoIndex(-4, 3)).toBe(1)
  })
})

describe('normalizePhotoIndex', () => {
  it('mantém índices válidos', () => {
    expect(normalizePhotoIndex(2, 5)).toBe(2)
  })

  it('dá a volta em índices negativos e acima do total', () => {
    expect(normalizePhotoIndex(-1, 5)).toBe(4)
    expect(normalizePhotoIndex(7, 5)).toBe(2)
  })

  it('retorna zero quando não há fotos', () => {
    expect(normalizePhotoIndex(3, 0)).toBe(0)
  })
})

describe('photoAlt', () => {
  it('descreve o imóvel com o número da foto em base 1', () => {
    expect(photoAlt('Apartamento no Batel', 0)).toBe(
      'Apartamento no Batel — foto 1',
    )
    expect(photoAlt('Apartamento no Batel', 2)).toBe(
      'Apartamento no Batel — foto 3',
    )
  })

  it('usa o fallback quando o título é vazio ou ausente', () => {
    expect(photoAlt('   ', 0)).toBe('Imóvel — foto 1')
    expect(photoAlt(null, 1)).toBe('Imóvel — foto 2')
    expect(photoAlt(undefined, 0)).toBe('Imóvel — foto 1')
  })
})

describe('photoCounterLabel', () => {
  it('mostra a posição em base 1', () => {
    expect(photoCounterLabel(0, 5)).toBe('Foto 1 de 5')
    expect(photoCounterLabel(4, 5)).toBe('Foto 5 de 5')
  })

  it('normaliza índice fora da faixa', () => {
    expect(photoCounterLabel(7, 5)).toBe('Foto 3 de 5')
  })
})
