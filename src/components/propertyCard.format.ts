import type { Property } from '@/lib/types'

export const PRICE_ON_REQUEST = 'Preço sob consulta'

export type PropertyAttributeKey = 'bedrooms' | 'bathrooms' | 'parking_spots' | 'area'

export interface PropertyAttribute {
  key: PropertyAttributeKey
  label: string
}

export type PropertyAttributesInput = Pick<
  Property,
  'bedrooms' | 'bathrooms' | 'parking_spots' | 'area'
>

const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const areaFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
})

function isPositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export function formatPrice(price: number): string {
  if (!isPositive(price)) return PRICE_ON_REQUEST
  return priceFormatter.format(price)
}

export function formatArea(area: number): string | null {
  if (!isPositive(area)) return null
  return `${areaFormatter.format(area)} m²`
}

export function formatLocation(neighborhood: string, city: string): string {
  return [neighborhood, city]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter((part) => part.length > 0)
    .join(' · ')
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function buildAttributes(property: PropertyAttributesInput): PropertyAttribute[] {
  const attributes: PropertyAttribute[] = []

  if (isPositive(property.bedrooms)) {
    attributes.push({
      key: 'bedrooms',
      label: pluralize(property.bedrooms, 'quarto', 'quartos'),
    })
  }

  if (isPositive(property.bathrooms)) {
    attributes.push({
      key: 'bathrooms',
      label: pluralize(property.bathrooms, 'banheiro', 'banheiros'),
    })
  }

  if (isPositive(property.parking_spots)) {
    attributes.push({
      key: 'parking_spots',
      label: pluralize(property.parking_spots, 'vaga', 'vagas'),
    })
  }

  const area = formatArea(property.area)
  if (area !== null) {
    attributes.push({ key: 'area', label: area })
  }

  return attributes
}

export interface ImageLoadState {
  complete: boolean
  naturalWidth: number
}

export function isBrokenImage(image: ImageLoadState | null): boolean {
  return image !== null && image.complete && image.naturalWidth === 0
}

export function getPrimaryPhoto(photos: Property['photos']): string | null {
  const found = (photos ?? []).find(
    (photo) => typeof photo === 'string' && photo.trim().length > 0,
  )
  return found ? found.trim() : null
}
