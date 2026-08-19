'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { resolveErrorMessage } from '@/lib/messages'
import styles from './propertyDetail.module.css'

export default function PropertyDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  const [isRetrying, startRetry] = useTransition()

  // reset() sozinho re-renderiza o boundary a partir do payload RSC que já
  // falhou; o refresh é o que refaz a requisição no servidor.
  const retry = () =>
    startRetry(() => {
      router.refresh()
      reset()
    })

  return (
    <section className={styles.error} role="alert">
      <h1 className={styles.title}>Não foi possível carregar o imóvel</h1>
      <p className={styles.errorMessage}>{resolveErrorMessage(error.message)}</p>
      <div className={styles.errorActions}>
        <button
          type="button"
          className={styles.retryButton}
          onClick={retry}
          disabled={isRetrying}
        >
          {isRetrying ? 'Tentando…' : 'Tentar novamente'}
        </button>
        <Link className={styles.backLink} href="/imoveis">
          ← Voltar aos resultados
        </Link>
      </div>
    </section>
  )
}
