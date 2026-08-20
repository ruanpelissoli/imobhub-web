import { describe, expect, it } from 'vitest'
import {
  EMPTY_FEATURED_TITLE,
  EMPTY_SEARCH_DESCRIPTION,
  EMPTY_SEARCH_TITLE,
  FEATURED_LOAD_ERROR_MESSAGE,
  GENERIC_ERROR_MESSAGE,
  GENERIC_LOAD_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  PROPERTY_NOT_FOUND_DESCRIPTION,
  PROPERTY_NOT_FOUND_MESSAGE,
  PROPERTY_NOT_FOUND_TITLE,
  SERVER_ERROR_MESSAGE,
  TIMEOUT_ERROR_MESSAGE,
  isUserFacingMessage,
  resolveErrorMessage,
} from './messages'

const NEXT_REDACTED_MESSAGE =
  'An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this Error instance which may provide more details about the nature of the error.'

describe('isUserFacingMessage', () => {
  it('reconhece as mensagens emitidas por api.ts', () => {
    expect(isUserFacingMessage(NETWORK_ERROR_MESSAGE)).toBe(true)
    expect(isUserFacingMessage(TIMEOUT_ERROR_MESSAGE)).toBe(true)
    expect(isUserFacingMessage(SERVER_ERROR_MESSAGE)).toBe(true)
    expect(isUserFacingMessage(PROPERTY_NOT_FOUND_MESSAGE)).toBe(true)
  })

  it('aplica trim antes de comparar', () => {
    expect(isUserFacingMessage(`  ${SERVER_ERROR_MESSAGE}  `)).toBe(true)
  })

  it('não reconhece mensagem desconhecida, ausente ou vazia', () => {
    expect(isUserFacingMessage(NEXT_REDACTED_MESSAGE)).toBe(false)
    expect(isUserFacingMessage('Error: connect ECONNREFUSED')).toBe(false)
    expect(isUserFacingMessage(null)).toBe(false)
    expect(isUserFacingMessage(undefined)).toBe(false)
    expect(isUserFacingMessage('   ')).toBe(false)
  })

  it('não reconhece os textos de UI que não vêm do ApiError', () => {
    expect(isUserFacingMessage(GENERIC_LOAD_ERROR_MESSAGE)).toBe(false)
    expect(isUserFacingMessage(EMPTY_SEARCH_TITLE)).toBe(false)
    expect(isUserFacingMessage(EMPTY_FEATURED_TITLE)).toBe(false)
    expect(isUserFacingMessage(FEATURED_LOAD_ERROR_MESSAGE)).toBe(false)
    expect(isUserFacingMessage(PROPERTY_NOT_FOUND_TITLE)).toBe(false)
    expect(isUserFacingMessage(PROPERTY_NOT_FOUND_DESCRIPTION)).toBe(false)
  })
})

describe('texto de erro dos destaques', () => {
  it('é discreto e não expõe detalhe técnico', () => {
    expect(FEATURED_LOAD_ERROR_MESSAGE).toBe(
      'Não foi possível carregar os destaques.',
    )
  })

  it('não é repassado por resolveErrorMessage', () => {
    expect(resolveErrorMessage(FEATURED_LOAD_ERROR_MESSAGE)).toBe(
      GENERIC_ERROR_MESSAGE,
    )
  })
})

describe('textos de estado vazio', () => {
  it('usa os títulos acordados para busca e destaques', () => {
    expect(EMPTY_SEARCH_TITLE).toBe('Nenhum imóvel encontrado')
    expect(EMPTY_FEATURED_TITLE).toBe(
      'Nenhum destaque disponível no momento',
    )
  })

  it('sugere ajustar os filtros na descrição da busca', () => {
    expect(EMPTY_SEARCH_DESCRIPTION).toMatch(/filtros/i)
  })

  it('usa o título sem ponto final no imóvel não encontrado', () => {
    expect(PROPERTY_NOT_FOUND_TITLE).toBe('Imóvel não encontrado')
    expect(PROPERTY_NOT_FOUND_TITLE).not.toBe(PROPERTY_NOT_FOUND_MESSAGE)
  })

  it('orienta a voltar aos resultados na descrição do imóvel não encontrado', () => {
    expect(PROPERTY_NOT_FOUND_DESCRIPTION).toMatch(/resultados/i)
  })
})

describe('resolveErrorMessage', () => {
  it('repassa a mensagem quando ela é reconhecidamente nossa', () => {
    expect(resolveErrorMessage(NETWORK_ERROR_MESSAGE)).toBe(
      NETWORK_ERROR_MESSAGE,
    )
  })

  it('substitui o texto redigido pelo Next em produção', () => {
    expect(resolveErrorMessage(NEXT_REDACTED_MESSAGE)).toBe(
      GENERIC_ERROR_MESSAGE,
    )
  })

  it('substitui detalhe técnico que vazaria em dev', () => {
    expect(resolveErrorMessage('TypeError: fetch failed')).toBe(
      GENERIC_ERROR_MESSAGE,
    )
  })

  it('usa o texto genérico quando a mensagem é ausente ou vazia', () => {
    expect(resolveErrorMessage(null)).toBe(GENERIC_ERROR_MESSAGE)
    expect(resolveErrorMessage(undefined)).toBe(GENERIC_ERROR_MESSAGE)
    expect(resolveErrorMessage('   ')).toBe(GENERIC_ERROR_MESSAGE)
  })

  it('devolve a mensagem sem espaços em volta', () => {
    expect(resolveErrorMessage(`  ${TIMEOUT_ERROR_MESSAGE}  `)).toBe(
      TIMEOUT_ERROR_MESSAGE,
    )
  })
})
