import styles from './page.module.css'

const SKELETON_CARDS = [1, 2, 3, 4, 5, 6]

export default function Loading() {
  return (
    <section>
      <h1 className="page-title">Resultados</h1>

      <div className={styles.layout}>
        <aside className={styles.filters} aria-hidden="true">
          <h2 className={styles.filtersTitle}>Filtros</h2>
        </aside>

        <div className={styles.results}>
          <p className={styles.resultCount} role="status">
            Carregando imóveis…
          </p>

          <ul className={styles.grid} aria-hidden="true">
            {SKELETON_CARDS.map((card) => (
              <li key={card}>
                <div className={styles.skeletonCard} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
