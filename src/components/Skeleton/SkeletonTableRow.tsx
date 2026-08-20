import { SkeletonBox } from './SkeletonBox'
import styles from './Skeleton.module.css'
import { DEFAULT_COLUMNS, resolveColumnCount } from './skeletonTable'

export interface SkeletonTableRowProps {
  columns?: number
  className?: string
}

export function SkeletonTableRow({
  columns = DEFAULT_COLUMNS,
  className,
}: SkeletonTableRowProps) {
  const count = resolveColumnCount(columns)

  return (
    <tr aria-hidden="true" className={className}>
      {Array.from({ length: count }, (_, index) => (
        <td key={index} className={styles.cell}>
          <SkeletonBox className={styles.cellLine} />
        </td>
      ))}
    </tr>
  )
}
