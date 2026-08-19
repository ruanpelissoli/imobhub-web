import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  buildQueryString,
  getPropertyById,
  isApiError,
  searchProperties,
} from './api'
import type { PaginatedResponse, Property, PropertyDetail } from './types'

const BASE_URL = 'http://localhost:8080'

const emptyPage: PaginatedResponse<Property> = {
  data: [],
  total: 0,
  page: 1,
  per_page: 20,
  total_pages: 0,
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mockFetch(response: Response | Error): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(() =>
    response instanceof Error
      ? Promise.reject(response)
      : Promise.resolve(response),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function calledUrl(fetchMock: ReturnType<typeof vi.fn>): string {
  return String(fetchMock.mock.calls[0][0])
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('buildQueryString', () => {
  it('retorna string vazia para filtros vazios', () => {
    expect(buildQueryString({})).toBe('')
  })

  it('omite undefined, null e strings vazias', () => {
    expect(
      buildQueryString({
        q: '',
        min_price: undefined,
        max_price: null,
        city: '   ',
        bedrooms: 3,
      }),
    ).toBe('?bedrooms=3')
  })

  it('mantém o valor zero', () => {
    expect(buildQueryString({ min_price: 0 })).toBe('?min_price=0')
  })

  it('serializa arrays como parâmetros repetidos', () => {
    expect(buildQueryString({ amenities: ['piscina', 'academia'] })).toBe(
      '?amenities=piscina&amenities=academia',
    )
  })

  it('descarta itens vazios dentro de arrays', () => {
    expect(buildQueryString({ amenities: ['piscina', '', '  '] })).toBe(
      '?amenities=piscina',
    )
  })

  it('faz URL-encode de acentuação e espaços', () => {
    expect(buildQueryString({ city: 'São Paulo' })).toBe('?city=S%C3%A3o+Paulo')
  })
})

describe('searchProperties', () => {
  it('chama o endpoint sem query string quando não há filtros', async () => {
    const fetchMock = mockFetch(jsonResponse(emptyPage))

    await searchProperties()

    expect(calledUrl(fetchMock)).toBe(`${BASE_URL}/api/v1/properties`)
  })

  it('monta a query string a partir dos filtros', async () => {
    const fetchMock = mockFetch(jsonResponse(emptyPage))

    await searchProperties({
      transaction_type: 'sale',
      city: 'São Paulo',
      neighborhood: 'Vila Mariana',
      amenities: ['piscina', 'academia'],
      min_price: undefined,
      page: 1,
      per_page: 20,
    })

    const url = calledUrl(fetchMock)
    expect(url).toContain('transaction_type=sale')
    expect(url).toContain('city=S%C3%A3o+Paulo')
    expect(url).toContain('neighborhood=Vila+Mariana')
    expect(url).toContain('amenities=piscina&amenities=academia')
    expect(url).not.toContain('min_price')
  })

  it('usa cache no-store', async () => {
    const fetchMock = mockFetch(jsonResponse(emptyPage))

    await searchProperties()

    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: 'no-store' })
  })

  it('trata resultado vazio como estado válido', async () => {
    mockFetch(jsonResponse(emptyPage))

    await expect(searchProperties({ q: 'inexistente' })).resolves.toEqual(
      emptyPage,
    )
  })

  it('propaga página além do total sem quebrar', async () => {
    const outOfRange: PaginatedResponse<Property> = {
      ...emptyPage,
      page: 99,
      total: 5,
      total_pages: 1,
    }
    mockFetch(jsonResponse(outOfRange))

    await expect(searchProperties({ page: 99 })).resolves.toEqual(outOfRange)
  })

  it('lança erro de requisição inválida em 4xx', async () => {
    mockFetch(jsonResponse({ error: 'bad filter' }, 400))

    await expect(searchProperties({ page: -1 })).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      code: 'http',
      message: 'Requisição inválida. Verifique os filtros e tente novamente.',
    })
  })

  it('lança erro de servidor em 5xx', async () => {
    mockFetch(jsonResponse({ error: 'boom' }, 500))

    await expect(searchProperties()).rejects.toMatchObject({
      status: 500,
      message: 'Erro no servidor. Tente novamente em instantes.',
    })
  })

  it('lança mensagem genérica de 4xx quando a listagem responde 404', async () => {
    mockFetch(jsonResponse({ error: 'not found' }, 404))

    await expect(searchProperties()).rejects.toMatchObject({
      status: 404,
      message: 'Requisição inválida. Verifique os filtros e tente novamente.',
    })
  })

  it('lança erro de conexão quando o fetch falha', async () => {
    mockFetch(new TypeError('fetch failed'))

    await expect(searchProperties()).rejects.toMatchObject({
      status: 0,
      code: 'network',
      message: 'Não foi possível conectar ao servidor.',
    })
  })

  it('lança erro de resposta inválida quando o corpo não é JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response('<html><body>oops</body></html>', {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
          }),
        ),
      ),
    )

    await expect(searchProperties()).rejects.toMatchObject({
      code: 'invalid_response',
      message: 'Resposta inválida do servidor.',
    })
  })

  it('lança erro de resposta inválida quando o JSON não é um objeto', async () => {
    mockFetch(jsonResponse(null))

    await expect(searchProperties()).rejects.toMatchObject({
      code: 'invalid_response',
    })
  })

  it('lança erro de timeout quando a requisição excede o limite', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'))
            })
          }),
      ),
    )

    const pending = searchProperties()
    const assertion = expect(pending).rejects.toMatchObject({
      status: 408,
      code: 'timeout',
      message: 'A requisição demorou demais. Tente novamente.',
    })

    await vi.advanceTimersByTimeAsync(10_000)
    await assertion
  })
})

describe('getPropertyById', () => {
  const detail: PropertyDetail = {
    id: 'abc',
    title: 'Apartamento na Vila Mariana',
    address: 'Rua Domingos de Morais, 100',
    neighborhood: 'Vila Mariana',
    city: 'São Paulo',
    price: 750000,
    area: 72,
    bedrooms: 2,
    bathrooms: 1,
    parking_spots: 1,
    created_at: '2026-01-10T12:00:00Z',
  }

  it('faz encode do id no path', async () => {
    const fetchMock = mockFetch(jsonResponse(detail))

    await getPropertyById('abc/123 x')

    expect(calledUrl(fetchMock)).toBe(
      `${BASE_URL}/api/v1/properties/abc%2F123%20x`,
    )
  })

  it('usa revalidação de 5 minutos', async () => {
    const fetchMock = mockFetch(jsonResponse(detail))

    await getPropertyById('abc')

    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      next: { revalidate: 300 },
    })
  })

  it('aceita detalhe sem listings', async () => {
    mockFetch(jsonResponse(detail))

    await expect(getPropertyById('abc')).resolves.toEqual(detail)
  })

  it('aceita detalhe com listings vazio', async () => {
    mockFetch(jsonResponse({ ...detail, listings: [] }))

    await expect(getPropertyById('abc')).resolves.toMatchObject({
      listings: [],
    })
  })

  it('lança ApiError 404 com mensagem amigável', async () => {
    mockFetch(jsonResponse({ error: 'not found' }, 404))

    await expect(getPropertyById('inexistente')).rejects.toMatchObject({
      status: 404,
      code: 'http',
      message: 'Imóvel não encontrado.',
    })
  })

  it('expõe o corpo do erro em details', async () => {
    mockFetch(jsonResponse({ error: 'not found' }, 404))

    try {
      await getPropertyById('inexistente')
      expect.unreachable('deveria ter lançado')
    } catch (error) {
      expect(isApiError(error)).toBe(true)
      expect((error as ApiError).details).toEqual({ error: 'not found' })
    }
  })
})
