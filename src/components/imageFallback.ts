export interface ImageLoadState {
  complete: boolean
  naturalWidth: number
}

export function isBrokenImage(image: ImageLoadState | null): boolean {
  return image !== null && image.complete && image.naturalWidth === 0
}
