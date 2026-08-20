import { PropertyCard } from '@/components/PropertyCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { isApiError, searchProperties } from '@/lib/api'
import { EMPTY_FEATURED_TITLE, FEATURED_LOAD_ERROR_MESSAGE } from '@/lib/messages'
import type { PaginatedResponse, Property } from '@/lib/types'
import { FeaturedError } from './FeaturedError'
import {
  FEATURED_FILTERS,
  FEATURED_SECTION_TITLE,
  takeFeatured,
} from './featuredFilters'
import styles from './home.module.css'

export async function FeaturedProperties() {
  let response: PaginatedResponse<Property> | null = null

  try {
    response = await searchProperties(FEATURED_FILTERS)
  } catch (error) {
    // Erro que não é ApiError é bug de código: re-lançar em vez de virar
    // mensagem amigável.
    if (!isApiError(error)) throw error
  }

  if (response === null) {
    return (
      <section className={styles.featured}>
        <h2 className={styles.title}>{FEATURED_SECTION_TITLE}</h2>
        <FeaturedError message={FEATURED_LOAD_ERROR_MESSAGE} />
      </section>
    )
  }

  const properties = takeFeatured(response.data)

  if (properties.length === 0) {
    return (
      <section className={styles.featured}>
        <h2 className={styles.title}>{FEATURED_SECTION_TITLE}</h2>
        <EmptyState title={EMPTY_FEATURED_TITLE} />
      </section>
    )
  }

  return (
    <section className={styles.featured}>
      <h2 className={styles.title}>{FEATURED_SECTION_TITLE}</h2>

      <ul className={styles.grid}>
        {properties.map((property) => (
          <li key={property.id}>
            <PropertyCard property={property} />
          </li>
        ))}
      </ul>
    </section>
  )
}
