import {
  CLIENT_ERROR_MESSAGE,
  INVALID_RESPONSE_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  PROPERTY_NOT_FOUND_MESSAGE,
  SERVER_ERROR_MESSAGE,
  TIMEOUT_ERROR_MESSAGE,
} from './messages'
import type {
  PaginatedResponse,
  Property,
  PropertyDetail,
  SearchFilters,
} from './types'

// Fallback explícito em vez de erro na inicialização: o build e o CI rodam sem
// a variável definida, e falhar ali quebraria a compilação por uma dependência
// que só é exercida em runtime.
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
).replace(/\/+$/, '')

const REQUEST_TIMEOUT_MS = 10_000

export type ApiErrorCode = 'http' | 'network' | 'timeout' | 'invalid_response'

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly details: unknown

  constructor(
    message: string,
    status: number,
    code: ApiErrorCode,
    details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

type QueryValue = string | number | boolean | string[] | null | undefined

export function buildQueryString(filters: Record<string, QueryValue>): string {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue

    if (Array.isArray(value)) {
      for (const item of value) {
        const normalized = String(item).trim()
        if (normalized !== '') params.append(key, normalized)
      }
      continue
    }

    const normalized = String(value).trim()
    if (normalized !== '') params.append(key, normalized)
  }

  const query = params.toString()
  return query === '' ? '' : `?${query}`
}

function httpErrorMessage(status: number, notFoundMessage?: string): string {
  if (status === 404 && notFoundMessage) return notFoundMessage
  if (status >= 500) return SERVER_ERROR_MESSAGE
  if (status >= 400) return CLIENT_ERROR_MESSAGE
  return INVALID_RESPONSE_MESSAGE
}

async function readBody(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

interface RequestOptions {
  init?: RequestInit
  notFoundMessage?: string
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController()
  let timedOut = false
  const timeoutId = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options.init,
      signal: controller.signal,
      headers: { Accept: 'application/json', ...options.init?.headers },
    })
  } catch (error) {
    if (timedOut) {
      throw new ApiError(TIMEOUT_ERROR_MESSAGE, 408, 'timeout', error)
    }
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0, 'network', error)
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    throw new ApiError(
      httpErrorMessage(response.status, options.notFoundMessage),
      response.status,
      'http',
      await readBody(response),
    )
  }

  const body = await readBody(response)
  if (typeof body !== 'object' || body === null) {
    throw new ApiError(
      INVALID_RESPONSE_MESSAGE,
      response.status,
      'invalid_response',
    )
  }

  return body as T
}

export function searchProperties(
  filters: SearchFilters = {},
): Promise<PaginatedResponse<Property>> {
  // Sem cache: o resultado depende de filtros arbitrários do usuário, então
  // cachear geraria entradas praticamente sempre únicas e serviria listagens
  // desatualizadas logo após um novo scrape.
  return request<PaginatedResponse<Property>>(
    `/api/v1/properties${buildQueryString({ ...filters })}`,
    { init: { cache: 'no-store' } },
  )
}

export function getPropertyById(id: string): Promise<PropertyDetail> {
  // Revalidação de 5 min: o detalhe muda apenas entre scrapes, e o cache reduz
  // carga na API em páginas que são as mais acessadas da aplicação.
  return request<PropertyDetail>(
    `/api/v1/properties/${encodeURIComponent(id)}`,
    {
      init: { next: { revalidate: 300 } },
      notFoundMessage: PROPERTY_NOT_FOUND_MESSAGE,
    },
  )
}
