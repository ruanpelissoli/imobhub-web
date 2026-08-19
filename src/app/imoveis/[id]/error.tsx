'use client'

import Link from 'next/link'

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
    <section className="property-error" role="alert">
      <h1 className="page-title">Não foi possível carregar o imóvel</h1>
      <p className="property-error__message">{message}</p>
      <div className="property-error__actions">
        <button
          type="button"
          className="property-error__retry"
          onClick={() => reset()}
        >
          Tentar novamente
        </button>
        <Link className="property-error__link" href="/imoveis">
          ← Voltar aos resultados
        </Link>
      </div>
    </section>
  )
}
