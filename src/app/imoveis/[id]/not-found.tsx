import Link from 'next/link'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  PROPERTY_NOT_FOUND_DESCRIPTION,
  PROPERTY_NOT_FOUND_TITLE,
} from '@/lib/messages'
import styles from './propertyDetail.module.css'

export default function PropertyNotFound() {
  return (
    <section className={styles.notFound}>
      <EmptyState
        title={PROPERTY_NOT_FOUND_TITLE}
        description={PROPERTY_NOT_FOUND_DESCRIPTION}
      />

      <p className={styles.notFoundActions}>
        <Link href="/imoveis">← Voltar aos resultados</Link>
      </p>
    </section>
  )
}
