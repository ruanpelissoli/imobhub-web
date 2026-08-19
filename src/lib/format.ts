export const FALLBACK_TITLE = 'Imóvel'
export const PRICE_UNAVAILABLE = 'Preço não informado'

const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const areaFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
})

type MaybeNumber = number | null | undefined
type MaybeString = string | null | undefined

function toFiniteNumber(value: MaybeNumber): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function toFilledText(value: MaybeString): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function formatTitle(title: MaybeString): string {
  return toFilledText(title) ?? FALLBACK_TITLE
}

export function formatPrice(price: MaybeNumber): string {
  const value = toFiniteNumber(price)
  if (value === null || value < 0) return PRICE_UNAVAILABLE
  return priceFormatter.format(value)
}

export function formatArea(area: MaybeNumber): string | null {
  const value = toFiniteNumber(area)
  if (value === null || value <= 0) return null
  return `${areaFormatter.format(value)} m²`
}

export interface AddressParts {
  address?: MaybeString
  neighborhood?: MaybeString
  city?: MaybeString
}

export function formatAddress({
  address,
  neighborhood,
  city,
}: AddressParts): string | null {
  const parts = [address, neighborhood, city]
    .map(toFilledText)
    .filter((part): part is string => part !== null)

  return parts.length === 0 ? null : parts.join(', ')
}

export function formatCount(
  value: MaybeNumber,
  singular: string,
  plural: string,
  zeroLabel: string,
): string | null {
  const count = toFiniteNumber(value)
  if (count === null || count < 0) return null
  if (count === 0) return zeroLabel

  const rounded = Math.trunc(count)
  return `${rounded} ${rounded === 1 ? singular : plural}`
}

export type PropertyAttributeKey =
  | 'area'
  | 'bedrooms'
  | 'bathrooms'
  | 'parking_spots'

export interface PropertyAttribute {
  key: PropertyAttributeKey
  text: string
}

export interface AttributeParts {
  area?: MaybeNumber
  bedrooms?: MaybeNumber
  bathrooms?: MaybeNumber
  parking_spots?: MaybeNumber
}

export function formatAttributes({
  area,
  bedrooms,
  bathrooms,
  parking_spots,
}: AttributeParts): PropertyAttribute[] {
  const candidates: ReadonlyArray<{
    key: PropertyAttributeKey
    text: string | null
  }> = [
    { key: 'area', text: formatArea(area) },
    {
      key: 'bedrooms',
      text: formatCount(bedrooms, 'quarto', 'quartos', 'Sem quartos'),
    },
    {
      key: 'bathrooms',
      text: formatCount(bathrooms, 'banheiro', 'banheiros', 'Sem banheiros'),
    },
    {
      key: 'parking_spots',
      text: formatCount(parking_spots, 'vaga', 'vagas', 'Sem vagas'),
    },
  ]

  return candidates.flatMap(({ key, text }) => (text ? [{ key, text }] : []))
}

export function toAmenityList(amenities?: string[] | null): string[] {
  const seen = new Set<string>()

  return (amenities ?? []).flatMap((amenity) => {
    const normalized = toFilledText(amenity)
    if (normalized === null || seen.has(normalized)) return []
    seen.add(normalized)
    return [normalized]
  })
}

export function formatDescription(description: MaybeString): string | null {
  return toFilledText(description)
}
