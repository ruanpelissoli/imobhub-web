import styles from './Skeleton.module.css'

export interface SkeletonBoxProps {
  width?: string
  height?: string
  radius?: 'sm' | 'card'
  className?: string
}

const RADIUS_CLASS = {
  sm: styles.radiusSm,
  card: styles.radiusCard,
} as const

export function SkeletonBox({
  width,
  height,
  radius = 'sm',
  className,
}: SkeletonBoxProps) {
  const classes = [styles.shimmer, RADIUS_CLASS[radius], className]
    .filter(Boolean)
    .join(' ')

  return <div aria-hidden="true" className={classes} style={{ width, height }} />
}
