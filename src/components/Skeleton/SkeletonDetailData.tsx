import { SkeletonBox } from './SkeletonBox'
import styles from './Skeleton.module.css'

export interface SkeletonDetailDataProps {
  className?: string
}

const CHIP_SLOTS = [1, 2, 3, 4]

export function SkeletonDetailData({ className }: SkeletonDetailDataProps) {
  const classes = [styles.detailData, className].filter(Boolean).join(' ')

  return (
    <div aria-hidden="true" className={classes}>
      <SkeletonBox className={styles.detailTitle} />
      <SkeletonBox className={styles.detailPrice} />
      <SkeletonBox className={styles.detailAddress} />

      <div className={styles.chips}>
        {CHIP_SLOTS.map((slot) => (
          <SkeletonBox key={slot} className={styles.chip} />
        ))}
      </div>
    </div>
  )
}
