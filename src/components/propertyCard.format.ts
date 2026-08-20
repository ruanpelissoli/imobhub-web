import { formatArea } from '@/lib/format'
import type { Property } from '@/lib/types'

export { PRICE_ON_REQUEST, formatArea, formatPrice } from '@/lib/format'

export type PropertyAttributeKey = 'bedrooms' | 'bathrooms' | 'parking_spots' | 'area'

export interface PropertyAttribute {
  key: PropertyAttributeKey
  label: string
}

export type PropertyAttributesInput = Pick<
  Property,
  'bedrooms' | 'bathrooms' | 'parking_spots' | 'area'
>

export interface ListingsBadgeInput {
  listings_count?: number | null
  listings?: readonly unknown[] | null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isPositive(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0
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

export function formatListingsBadge(property: ListingsBadgeInput): string | null {
  const raw = isFiniteNumber(property.listings_count)
    ? property.listings_count
    : Array.isArray(property.listings)
      ? property.listings.length
      : null

  if (raw === null) return null

  const count = Math.trunc(raw)
  return count >= 2 ? `${count} imobiliárias` : null
}

export { isBrokenImage, type ImageLoadState } from './imageFallback'

export function getPrimaryPhoto(photos: Property['photos']): string | null {
  const found = (photos ?? []).find(
    (photo) => typeof photo === 'string' && photo.trim().length > 0,
  )
  return found ? found.trim() : null
}
