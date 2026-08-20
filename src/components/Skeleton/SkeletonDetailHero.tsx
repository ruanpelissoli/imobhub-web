import { SkeletonBox } from './SkeletonBox'
import styles from './Skeleton.module.css'

export interface SkeletonDetailHeroProps {
  className?: string
}

const THUMBNAIL_SLOTS = [1, 2, 3, 4]

export function SkeletonDetailHero({ className }: SkeletonDetailHeroProps) {
  const classes = [styles.hero, className].filter(Boolean).join(' ')

  return (
    <div aria-hidden="true" className={classes}>
      <SkeletonBox radius="card" className={styles.heroFrame} />

      <div className={styles.thumbs}>
        {THUMBNAIL_SLOTS.map((slot) => (
          <SkeletonBox key={slot} radius="card" className={styles.thumb} />
        ))}
      </div>
    </div>
  )
}
