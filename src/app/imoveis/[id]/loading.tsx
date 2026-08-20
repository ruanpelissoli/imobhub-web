import {
  SkeletonBox,
  SkeletonDetailData,
  SkeletonDetailHero,
} from '@/components/Skeleton'
import styles from './propertyDetail.module.css'

const LISTING_SLOTS = [1, 2, 3]

export default function Loading() {
  return (
    <div className={styles.loading}>
      <p className={styles.loadingText} role="status">
        Carregando imóvel…
      </p>

      <SkeletonBox className={styles.loadingBackLink} />

      <SkeletonDetailHero />

      <SkeletonDetailData />

      <section className={styles.section} aria-hidden="true">
        <SkeletonBox className={styles.loadingSectionTitle} />

        <ul className={styles.listings}>
          {LISTING_SLOTS.map((slot) => (
            <li className={styles.listing} key={slot}>
              <SkeletonBox className={styles.loadingListingAgency} />
              <SkeletonBox className={styles.loadingListingPrice} />
              <SkeletonBox className={styles.loadingListingLink} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
