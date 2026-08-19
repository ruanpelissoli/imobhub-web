import { FALLBACK_TITLE } from '../lib/format'

export function toPhotoList(photos?: string[] | null): string[] {
  return (photos ?? []).flatMap((photo) => {
    const url = typeof photo === 'string' ? photo.trim() : ''
    return url === '' ? [] : [url]
  })
}

export function normalizePhotoIndex(index: number, total: number): number {
  if (!Number.isFinite(index) || total <= 0) return 0
  const truncated = Math.trunc(index)
  return ((truncated % total) + total) % total
}

export function nextPhotoIndex(current: number, total: number): number {
  if (total <= 1) return 0
  return normalizePhotoIndex(current + 1, total)
}

export function prevPhotoIndex(current: number, total: number): number {
  if (total <= 1) return 0
  return normalizePhotoIndex(current - 1, total)
}

export function photoAlt(
  title: string | null | undefined,
  index: number,
): string {
  const name = title?.trim() ? title.trim() : FALLBACK_TITLE
  return `${name} — foto ${Math.max(0, Math.trunc(index)) + 1}`
}

export function photoCounterLabel(index: number, total: number): string {
  return `Foto ${normalizePhotoIndex(index, total) + 1} de ${Math.max(total, 1)}`
}
