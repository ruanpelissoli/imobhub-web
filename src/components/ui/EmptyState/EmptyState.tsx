import styles from './EmptyState.module.css'

export interface EmptyStateAction {
  label: string
  onClick: () => void
}

export interface EmptyStateProps {
  title: string
  description?: string
  action?: EmptyStateAction
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="11" cy="11" r="6.5" />
        <path d="m20 20-4.5-4.5" />
        <path d="M8.5 11h5" />
      </svg>

      <p className={styles.title}>{title}</p>

      {description !== undefined && (
        <p className={styles.description}>{description}</p>
      )}

      {action !== undefined && (
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => action.onClick()}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
