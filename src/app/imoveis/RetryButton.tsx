'use client'

import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export function RetryButton() {
  const router = useRouter()

  return (
    <button type="button" className={styles.retryButton} onClick={() => router.refresh()}>
      Tentar novamente
    </button>
  )
}
