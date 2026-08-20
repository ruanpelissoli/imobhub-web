import { GENERIC_LOAD_ERROR_MESSAGE } from '@/lib/messages'

export function resolveDisplayMessage(
  message: string | null | undefined,
): string {
  const trimmed = message?.trim() ?? ''
  return trimmed === '' ? GENERIC_LOAD_ERROR_MESSAGE : trimmed
}
