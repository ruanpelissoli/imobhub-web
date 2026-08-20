import { PropertyCard } from '@/components/PropertyCard'
import { isApiError, searchProperties } from '@/lib/api'
import { FEATURED_LOAD_ERROR_MESSAGE } from '@/lib/messages'
import type { PaginatedResponse, Property } from '@/lib/types'
import { FEATURED_FILTERS, takeFeatured } from './featuredFilters'
import styles from './home.module.css'

const SECTION_TITLE = 'Imóveis em destaque'

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
        <h2 className={styles.title}>{SECTION_TITLE}</h2>
        <p className={styles.status} role="status">
          {FEATURED_LOAD_ERROR_MESSAGE}
        </p>
      </section>
    )
  }

  const properties = takeFeatured(response.data)
  if (properties.length === 0) return null

  return (
    <section className={styles.featured}>
      <h2 className={styles.title}>{SECTION_TITLE}</h2>

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
