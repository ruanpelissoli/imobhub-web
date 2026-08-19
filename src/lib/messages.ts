export const NETWORK_ERROR_MESSAGE = 'Não foi possível conectar ao servidor.'
export const TIMEOUT_ERROR_MESSAGE =
  'A requisição demorou demais. Tente novamente.'
export const INVALID_RESPONSE_MESSAGE = 'Resposta inválida do servidor.'
export const SERVER_ERROR_MESSAGE =
  'Erro no servidor. Tente novamente em instantes.'
export const CLIENT_ERROR_MESSAGE =
  'Requisição inválida. Verifique os filtros e tente novamente.'
export const PROPERTY_NOT_FOUND_MESSAGE = 'Imóvel não encontrado.'

export const GENERIC_ERROR_MESSAGE =
  'Não foi possível carregar o imóvel. Tente novamente em instantes.'

const USER_FACING_MESSAGES: ReadonlySet<string> = new Set([
  NETWORK_ERROR_MESSAGE,
  TIMEOUT_ERROR_MESSAGE,
  INVALID_RESPONSE_MESSAGE,
  SERVER_ERROR_MESSAGE,
  CLIENT_ERROR_MESSAGE,
  PROPERTY_NOT_FOUND_MESSAGE,
])

export function isUserFacingMessage(message: string | null | undefined): boolean {
  return USER_FACING_MESSAGES.has(message?.trim() ?? '')
}

// O Next redige a mensagem de erros de Server Component em produção, entregando
// ao boundary de client um texto técnico em inglês. Só repassamos a mensagem
// quando ela é reconhecidamente nossa; qualquer outra coisa vira o texto genérico.
export function resolveErrorMessage(message: string | null | undefined): string {
  return isUserFacingMessage(message)
    ? (message as string).trim()
    : GENERIC_ERROR_MESSAGE
}
