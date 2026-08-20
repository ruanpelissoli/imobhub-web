import { SkeletonCard } from '@/components/Skeleton'
import { FEATURED_LIMIT, FEATURED_SECTION_TITLE } from './featuredFilters'
import styles from './home.module.css'

const SKELETON_SLOTS = Array.from(
  { length: FEATURED_LIMIT },
  (_, index) => index,
)

export function FeaturedSkeleton() {
  return (
    <section className={styles.featured}>
      <h2 className={styles.title}>{FEATURED_SECTION_TITLE}</h2>

      <p className={styles.srOnly} role="status">
        Carregando destaques…
      </p>

      <ul className={styles.grid} aria-hidden="true">
        {SKELETON_SLOTS.map((slot) => (
          <li key={slot}>
            <SkeletonCard />
          </li>
        ))}
      </ul>
    </section>
  )
}
