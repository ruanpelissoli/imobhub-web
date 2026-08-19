import { describe, expect, it } from 'vitest'
import {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  PROPERTY_NOT_FOUND_MESSAGE,
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
