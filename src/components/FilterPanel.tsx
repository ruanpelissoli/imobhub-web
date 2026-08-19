'use client'

import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import type { SearchFilters } from '@/lib/types'
import {
  buildFilterUrl,
  clearFilterUrl,
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const data = new FormData(event.currentTarget)
    const values: FilterPanelValues = {}

    for (const key of FILTER_PARAM_KEYS) {
      values[key] = String(data.get(key) ?? '')
    }

    router.push(buildFilterUrl(values, currentQuery))
  }

  function handleClear() {
    router.push(clearFilterUrl(currentQuery))
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

  return (
    <aside className={styles.panel} aria-labelledby="filtros-titulo">
      <h2 id="filtros-titulo" className={styles.title}>
        Filtros
      </h2>

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
    </aside>
  )
}
