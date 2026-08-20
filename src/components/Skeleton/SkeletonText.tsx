import { SkeletonBox } from './SkeletonBox'
import styles from './Skeleton.module.css'
import { DEFAULT_LINES, resolveLineWidths } from './skeletonWidths'

export interface SkeletonTextProps {
  lines?: number
  width?: string | string[]
  className?: string
}

export function SkeletonText({
  lines = DEFAULT_LINES,
  width,
  className,
}: SkeletonTextProps) {
  const widths = resolveLineWidths(lines, width)

  if (widths.length === 0) return null

  const classes = [styles.text, className].filter(Boolean).join(' ')

  return (
    <div aria-hidden="true" className={classes}>
      {widths.map((lineWidth, index) => (
        <SkeletonBox
          key={index}
          width={lineWidth}
          className={styles.textLine}
        />
      ))}
    </div>
  )
}
