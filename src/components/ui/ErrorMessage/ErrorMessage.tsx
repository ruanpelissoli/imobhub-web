import styles from './ErrorMessage.module.css'
import { resolveDisplayMessage } from './errorMessageText'

export interface ErrorMessageProps {
  message?: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className={styles.container} role="alert">
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
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5" />
        <path d="M12 16.25h.01" />
      </svg>

      <p className={styles.text}>{resolveDisplayMessage(message)}</p>

      {onRetry !== undefined && (
        <button
          type="button"
          className={styles.retryButton}
          onClick={() => onRetry()}
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}
