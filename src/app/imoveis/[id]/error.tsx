'use client'

import Link from 'next/link'
import styles from './propertyDetail.module.css'

const FALLBACK_MESSAGE =
  'Não foi possível carregar o imóvel. Tente novamente em instantes.'

export default function PropertyDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const message = error.message?.trim() ? error.message.trim() : FALLBACK_MESSAGE

  return (
    <section className={styles.error} role="alert">
      <h1 className={styles.title}>Não foi possível carregar o imóvel</h1>
      <p className={styles.errorMessage}>{message}</p>
      <div className={styles.errorActions}>
        <button
          type="button"
          className={styles.retryButton}
          onClick={() => reset()}
        >
          Tentar novamente
        </button>
        <Link className={styles.backLink} href="/imoveis">
          ← Voltar aos resultados
        </Link>
      </div>
    </section>
  )
}
