import { SkeletonBox } from './SkeletonBox'
import { SkeletonText } from './SkeletonText'
import styles from './Skeleton.module.css'

export interface SkeletonCardProps {
  className?: string
}

const ATTRIBUTE_SLOTS = ['bedrooms', 'bathrooms', 'area']

export function SkeletonCard({ className }: SkeletonCardProps) {
  const classes = [styles.card, className].filter(Boolean).join(' ')

  return (
    <div aria-hidden="true" className={classes}>
      <div className={`${styles.shimmer} ${styles.cardMedia}`} />

      <div className={styles.cardBody}>
        <SkeletonBox className={styles.priceLine} />
        <SkeletonText lines={2} />
        <SkeletonBox className={styles.locationLine} />

        <div className={styles.attributes}>
          {ATTRIBUTE_SLOTS.map((slot) => (
            <SkeletonBox key={slot} className={styles.attributeChip} />
          ))}
        </div>
      </div>
    </div>
  )
}
