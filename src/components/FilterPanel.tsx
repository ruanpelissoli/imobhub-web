'use client'

import { useRouter } from 'next/navigation'
import {
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import type { SearchFilters } from '@/lib/types'
import {
  buildFilterUrl,
  clearFilterUrl,
  countActiveFilters,
  FILTER_PARAM_KEYS,
  PROPERTY_TYPE_OPTIONS,
  toPropertyTypeOption,
  type FilterPanelValues,
} from './filterPanelUrl'
import styles from './FilterPanel.module.css'

interface Option {
  value: string
  label: string
}

const COMPACT_MEDIA_QUERY = '(max-width: 1024px)'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function subscribeCompact(onStoreChange: () => void) {
  const query = window.matchMedia(COMPACT_MEDIA_QUERY)
  query.addEventListener('change', onStoreChange)
  return () => query.removeEventListener('change', onStoreChange)
}

function getCompactSnapshot() {
  return window.matchMedia(COMPACT_MEDIA_QUERY).matches
}

function getCompactServerSnapshot() {
  return false
}

const ANY_OPTION: Option = { value: '', label: 'Qualquer' }

const TRANSACTION_OPTIONS: ReadonlyArray<Option> = [
  { value: '', label: 'Todos' },
  { value: 'sale', label: 'Comprar' },
  { value: 'rent', label: 'Alugar' },
]

const BEDROOM_OPTIONS: ReadonlyArray<Option> = [
  ANY_OPTION,
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4+' },
]

const BATHROOM_OPTIONS: ReadonlyArray<Option> = [
  ANY_OPTION,
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3+' },
]

const PARKING_OPTIONS: ReadonlyArray<Option> = [
  ANY_OPTION,
  { value: '0', label: '0' },
  { value: '1', label: '1' },
  { value: '2', label: '2+' },
]

function toCountDefault(
  value: number | undefined,
  options: ReadonlyArray<Option>,
): string {
  if (value === undefined || !Number.isInteger(value) || value < 0) return ''

  let selected = ''
  for (const option of options) {
    if (option.value !== '' && Number(option.value) <= value) {
      selected = option.value
    }
  }

  return selected
}

function toNumberDefault(value: number | undefined): string {
  return value !== undefined && Number.isFinite(value) && value >= 0
    ? String(value)
    : ''
}

interface FilterPanelProps {
  defaults: SearchFilters
  currentQuery?: string
}

export function FilterPanel({ defaults, currentQuery = '' }: FilterPanelProps) {
  const router = useRouter()
  const isCompact = useSyncExternalStore(
    subscribeCompact,
    getCompactSnapshot,
    getCompactServerSnapshot,
  )
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const activeCount = countActiveFilters(defaults)

  const bindDialog = useCallback((node: HTMLDivElement) => {
    // Travar só o body não basta: globals.css põe overflow-x no <html>, então é
    // ele que rola e o overflow do body deixa de propagar para o viewport.
    const root = document.documentElement
    const { body } = document
    const previousRootOverflow = root.style.overflow
    const previousBodyOverflow = body.style.overflow
    const trigger = triggerRef.current

    root.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    ;(closeRef.current ?? node).focus()

    return () => {
      root.style.overflow = previousRootOverflow
      body.style.overflow = previousBodyOverflow
      trigger?.focus()
    }
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const data = new FormData(event.currentTarget)
    const values: FilterPanelValues = {}

    for (const key of FILTER_PARAM_KEYS) {
      values[key] = String(data.get(key) ?? '')
    }

    setIsOpen(false)
    router.push(buildFilterUrl(values, currentQuery))
  }

  function handleClear() {
    setIsOpen(false)
    router.push(clearFilterUrl(currentQuery))
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setIsOpen(false)
      return
    }

    if (event.key !== 'Tab') return

    const focusables = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    )
    if (focusables.length === 0) return

    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement

    if (event.shiftKey && (active === first || active === event.currentTarget)) {
      event.preventDefault()
      last.focus()
      return
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  function renderChips(
    name: string,
    legend: string,
    options: ReadonlyArray<Option>,
    selected: string,
  ) {
    return (
      <fieldset className={styles.group}>
        <legend className={styles.legend}>{legend}</legend>
        <div className={styles.chips}>
          {options.map(({ value, label }) => (
            <label className={styles.chip} key={`${name}-${value}`}>
              <input
                type="radio"
                name={name}
                value={value}
                defaultChecked={value === selected}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
    )
  }

  function renderForm() {
    return (
      <form className={styles.form} onSubmit={handleSubmit}>
        {renderChips(
          'transaction_type',
          'Tipo de transação',
          TRANSACTION_OPTIONS,
          defaults.transaction_type ?? '',
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="filtro-property-type">
            Tipo de imóvel
          </label>
          <select
            className={styles.control}
            id="filtro-property-type"
            name="property_type"
            defaultValue={toPropertyTypeOption(defaults.property_type) ?? ''}
          >
            <option value="">Qualquer</option>
            {PROPERTY_TYPE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="filtro-min-price">
              Preço mín. (R$)
            </label>
            <input
              className={styles.control}
              id="filtro-min-price"
              name="min_price"
              type="number"
              min={0}
              step="any"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              defaultValue={toNumberDefault(defaults.min_price)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="filtro-max-price">
              Preço máx. (R$)
            </label>
            <input
              className={styles.control}
              id="filtro-max-price"
              name="max_price"
              type="number"
              min={0}
              step="any"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Sem limite"
              defaultValue={toNumberDefault(defaults.max_price)}
            />
          </div>
        </div>

        {renderChips(
          'bedrooms',
          'Quartos',
          BEDROOM_OPTIONS,
          toCountDefault(defaults.bedrooms, BEDROOM_OPTIONS),
        )}

        {renderChips(
          'bathrooms',
          'Banheiros',
          BATHROOM_OPTIONS,
          toCountDefault(defaults.bathrooms, BATHROOM_OPTIONS),
        )}

        {renderChips(
          'parking_spots',
          'Vagas',
          PARKING_OPTIONS,
          toCountDefault(defaults.parking_spots, PARKING_OPTIONS),
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="filtro-min-area">
            Área mínima (m²)
          </label>
          <input
            className={styles.control}
            id="filtro-min-area"
            name="min_area"
            type="number"
            min={0}
            step="any"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            defaultValue={toNumberDefault(defaults.min_area)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="filtro-city">
            Cidade
          </label>
          <input
            className={styles.control}
            id="filtro-city"
            name="city"
            type="text"
            autoComplete="off"
            placeholder="Ex.: Curitiba"
            defaultValue={defaults.city ?? ''}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="filtro-neighborhood">
            Bairro
          </label>
          <input
            className={styles.control}
            id="filtro-neighborhood"
            name="neighborhood"
            type="text"
            autoComplete="off"
            placeholder="Ex.: Água Verde"
            defaultValue={defaults.neighborhood ?? ''}
          />
        </div>

        <div className={styles.actions}>
          <button className={styles.apply} type="submit">
            Aplicar filtros
          </button>
          <button className={styles.clear} type="button" onClick={handleClear}>
            Limpar filtros
          </button>
        </div>
      </form>
    )
  }

  if (!isCompact) {
    return (
      <aside className={styles.panel} aria-labelledby="filtros-titulo">
        <h2 id="filtros-titulo" className={styles.title}>
          Filtros
        </h2>

        {renderForm()}
      </aside>
    )
  }

  return (
    <div className={styles.wrapper}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        type="button"
        aria-expanded={isOpen}
        aria-controls="filtros-drawer"
        onClick={() => setIsOpen(true)}
      >
        <svg
          className={styles.triggerIcon}
          viewBox="0 0 20 20"
          width="18"
          height="18"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M2 4a1 1 0 0 1 1-1h14a1 1 0 0 1 .78 1.63L12.5 11.1V16a1 1 0 0 1-1.45.9l-3-1.5A1 1 0 0 1 7.5 14.5v-3.4L2.22 4.63A1 1 0 0 1 2 4Z" />
        </svg>
        Filtros
        {activeCount > 0 && (
          <span className={styles.count}>({activeCount})</span>
        )}
      </button>

      {isOpen && (
        <div
          ref={bindDialog}
          className={styles.dialog}
          id="filtros-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="filtros-titulo"
          tabIndex={-1}
          onKeyDown={handleDialogKeyDown}
        >
          <button
            className={styles.overlay}
            type="button"
            aria-label="Fechar filtros"
            onClick={() => setIsOpen(false)}
          />

          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <h2 id="filtros-titulo" className={styles.title}>
                Filtros
              </h2>

              <button
                ref={closeRef}
                className={styles.close}
                type="button"
                aria-label="Fechar filtros"
                onClick={() => setIsOpen(false)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            {renderForm()}
          </div>
        </div>
      )}
    </div>
  )
}
