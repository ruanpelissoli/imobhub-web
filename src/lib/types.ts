export type TransactionType = 'sale' | 'rent'

export interface Property {
  id: string
  title: string
  address: string
  neighborhood: string
  city: string
  price: number
  area: number
  bedrooms: number
  bathrooms: number
  parking_spots: number
  amenities?: string[] | null
  photos?: string[] | null
  description?: string | null
  created_at: string
}

export interface Listing {
  id: string
  agency_name: string
  price: number
  url: string
  scraped_at: string
}

export interface PropertyDetail extends Property {
  listings?: Listing[] | null
}

export interface SearchFilters {
  q?: string
  transaction_type?: TransactionType
  property_type?: string
  min_price?: number
  max_price?: number
  bedrooms?: number
  bathrooms?: number
  parking_spots?: number
  min_area?: number
  amenities?: string[]
  city?: string
  neighborhood?: string
  page?: number
  per_page?: number
  sort?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}
