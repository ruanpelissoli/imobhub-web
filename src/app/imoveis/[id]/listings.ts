import { formatPrice } from '@/lib/format'

export const FALLBACK_AGENCY_NAME = 'Imobiliária'

export interface ListingInput {
  id?: string | null
  agency_name?: string | null
  price?: number | null
  url?: string | null
}

export interface ListingView {
  key: string
  agencyName: string
  price: string
  url: string | null
  linkLabel: string
}

function toAgencyName(value?: string | null): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : FALLBACK_AGENCY_NAME
}

function toExternalUrl(value?: string | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null

  try {
    const { protocol } = new URL(trimmed)
    return protocol === 'http:' || protocol === 'https:' ? trimmed : null
  } catch {
    return null
  }
}

function toSortablePrice(value?: number | null): number | null {
  const isValid = typeof value === 'number' && Number.isFinite(value) && value > 0
  return isValid ? value : null
}

export function toListingViews(
  listings?: readonly (ListingInput | null | undefined)[] | null,
): ListingView[] {
  return (listings ?? [])
    .map((listing, index) => {
      const agencyName = toAgencyName(listing?.agency_name)

      return {
        index,
        sortPrice: toSortablePrice(listing?.price),
        view: {
          key: `${index}-${listing?.id ?? 'listing'}`,
          agencyName,
          price: formatPrice(listing?.price),
          url: toExternalUrl(listing?.url),
          linkLabel: `Ver anúncio original de ${agencyName}`,
        },
      }
    })
    .sort((a, b) => {
      if (a.sortPrice === null && b.sortPrice === null) return a.index - b.index
      if (a.sortPrice === null) return 1
      if (b.sortPrice === null) return -1
      if (a.sortPrice === b.sortPrice) return a.index - b.index
      return a.sortPrice - b.sortPrice
    })
    .map((entry) => entry.view)
}
