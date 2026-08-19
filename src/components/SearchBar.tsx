'use client'

import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import type { TransactionType } from '@/lib/types'
import { buildSearchUrl, toTransactionType } from './searchBarUrl'

const TRANSACTION_OPTIONS: ReadonlyArray<{
  value: TransactionType
  label: string
}> = [
  { value: 'sale', label: 'Comprar' },
  { value: 'rent', label: 'Alugar' },
]

const DEFAULT_TRANSACTION_TYPE: TransactionType = 'sale'

interface SearchBarProps {
  defaultQuery?: string
  defaultTransactionType?: TransactionType
}

export default function SearchBar({
  defaultQuery = '',
  defaultTransactionType = DEFAULT_TRANSACTION_TYPE,
}: SearchBarProps) {
  const router = useRouter()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const data = new FormData(event.currentTarget)

    router.push(
      buildSearchUrl({
        q: String(data.get('q') ?? ''),
        transaction_type:
          toTransactionType(data.get('transaction_type')) ??
          DEFAULT_TRANSACTION_TYPE,
      }),
    )
  }

  return (
    <form className="search-bar" role="search" onSubmit={handleSubmit}>
      <div className="search-bar__field">
        <label className="search-bar__label" htmlFor="search-bar-q">
          Cidade, bairro ou palavra-chave
        </label>
        <input
          className="search-bar__input"
          id="search-bar-q"
          name="q"
          type="search"
          autoComplete="off"
          placeholder="Ex.: Curitiba, Água Verde, apartamento com varanda"
          defaultValue={defaultQuery}
        />
      </div>

      <fieldset className="search-bar__transaction">
        <legend className="search-bar__label">Tipo de transação</legend>
        <div className="search-bar__options">
          {TRANSACTION_OPTIONS.map(({ value, label }) => (
            <label className="search-bar__option" key={value}>
              <input
                type="radio"
                name="transaction_type"
                value={value}
                defaultChecked={value === defaultTransactionType}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <button className="search-bar__submit" type="submit">
        Buscar
      </button>
    </form>
  )
}
