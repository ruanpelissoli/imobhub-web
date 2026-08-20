import { describe, expect, it } from 'vitest'
import { GENERIC_LOAD_ERROR_MESSAGE, NETWORK_ERROR_MESSAGE } from '@/lib/messages'
import { resolveDisplayMessage } from './errorMessageText'

describe('resolveDisplayMessage', () => {
  it('repassa a mensagem recebida como veio', () => {
    expect(resolveDisplayMessage(NETWORK_ERROR_MESSAGE)).toBe(
      NETWORK_ERROR_MESSAGE,
    )
  })

  it('devolve a mensagem sem espaços em volta', () => {
    expect(resolveDisplayMessage(`  ${NETWORK_ERROR_MESSAGE}  `)).toBe(
      NETWORK_ERROR_MESSAGE,
    )
  })

  it('cai no texto genérico quando a mensagem é ausente, vazia ou só espaços', () => {
    expect(resolveDisplayMessage(undefined)).toBe(GENERIC_LOAD_ERROR_MESSAGE)
    expect(resolveDisplayMessage(null)).toBe(GENERIC_LOAD_ERROR_MESSAGE)
    expect(resolveDisplayMessage('')).toBe(GENERIC_LOAD_ERROR_MESSAGE)
    expect(resolveDisplayMessage('   ')).toBe(GENERIC_LOAD_ERROR_MESSAGE)
  })

  it('não trata mensagem desconhecida como suspeita', () => {
    expect(resolveDisplayMessage('Erro 999 do parceiro')).toBe(
      'Erro 999 do parceiro',
    )
  })
})
