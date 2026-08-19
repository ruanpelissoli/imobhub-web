import Link from 'next/link'
import { PropertyCard } from '@/components/PropertyCard'
import { isApiError, searchProperties } from '@/lib/api'
import type { PaginatedResponse, Property } from '@/lib/types'
import { RetryButton } from './RetryButton'
import styles from './page.module.css'
import {
  buildPageHref,
  buildPagination,
  formatResultCount,
  parseSearchFilters,
  type RawSearchParams,
} from './searchFilters'

export const metadata = {
  title: 'Resultados',
}

function FiltersPlaceholder() {
  return (
    <aside className={styles.filters} aria-labelledby="filtros-titulo">
      <h2 id="filtros-titulo" className={styles.filtersTitle}>
        Filtros
      </h2>
      <p className={styles.filtersHint}>
        O refinamento por preço, tipo e características chega em breve.
      </p>
    </aside>
  )
}

export default async function ResultadosPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  const raw = await searchParams
  const filters = parseSearchFilters(raw)

  let response: PaginatedResponse<Property> | null = null
  let errorMessage: string | null = null

  try {
    response = await searchProperties(filters)
  } catch (error) {
    // Erro que não é ApiError é bug de código: re-lançar em vez de virar
    // mensagem amigável.
    if (!isApiError(error)) throw error
    errorMessage = error.message
  }

  const requestedPage = filters.page ?? 1
  const currentPage =
    response && Number.isFinite(response.page) && response.page >= 1
      ? Math.trunc(response.page)
      : requestedPage
  const totalPages =
    response && Number.isFinite(response.total_pages) && response.total_pages > 0
      ? Math.trunc(response.total_pages)
      : 0
  const pagination = buildPagination(raw, currentPage, totalPages)

  return (
    <section>
      <h1 className="page-title">Resultados</h1>

      <div className={styles.layout}>
        <FiltersPlaceholder />

        <div className={styles.results}>
          {errorMessage !== null && (
            <div className={styles.error} role="alert">
              <p>{errorMessage}</p>
              <RetryButton />
            </div>
          )}

          {response !== null && response.data.length === 0 && (
            <>
              <p className="empty-state">
                Nenhum imóvel encontrado para os filtros selecionados.
              </p>
              {currentPage > 1 && (
                <p className={styles.emptyActions}>
                  <Link href={buildPageHref(raw, 1)}>
                    Voltar para a primeira página
                  </Link>
                </p>
              )}
            </>
          )}

          {response !== null && response.data.length > 0 && (
            <>
              <p className={styles.resultCount}>
                {formatResultCount(response.total)}
              </p>

              <ul className={styles.grid}>
                {response.data.map((property) => (
                  <li key={property.id}>
                    <PropertyCard property={property} headingLevel={2} />
                  </li>
                ))}
              </ul>
            </>
          )}

          {pagination.isVisible && (
            <nav className={styles.pagination} aria-label="Paginação">
              {pagination.previousHref !== null ? (
                <Link
                  className={styles.pageLink}
                  href={pagination.previousHref}
                  rel="prev"
                >
                  Anterior
                </Link>
              ) : (
                <span className={styles.pageLinkDisabled} aria-disabled="true">
                  Anterior
                </span>
              )}

              <span className={styles.pageStatus}>
                Página {pagination.currentPage} de {pagination.totalPages}
              </span>

              {pagination.nextHref !== null ? (
                <Link
                  className={styles.pageLink}
                  href={pagination.nextHref}
                  rel="next"
                >
                  Próximo
                </Link>
              ) : (
                <span className={styles.pageLinkDisabled} aria-disabled="true">
                  Próximo
                </span>
              )}
            </nav>
          )}
        </div>
      </div>
    </section>
  )
}
