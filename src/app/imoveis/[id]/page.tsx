import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PropertyGallery } from '@/components/PropertyGallery'
import { getPropertyById, isApiError } from '@/lib/api'
import {
  formatAddress,
  formatAttributes,
  formatDescription,
  formatPrice,
  formatTitle,
  toAmenityList,
} from '@/lib/format'
import type { PropertyDetail } from '@/lib/types'
import styles from './propertyDetail.module.css'

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>
}

async function loadProperty(id: string): Promise<PropertyDetail | null> {
  try {
    return await getPropertyById(id)
  } catch (error) {
    if (isApiError(error) && error.status === 404) return null
    throw error
  }
}

export async function generateMetadata({
  params,
}: PropertyDetailPageProps): Promise<Metadata> {
  const { id } = await params

  try {
    const property = await loadProperty(id)
    return {
      title: property ? formatTitle(property.title) : 'Imóvel não encontrado',
    }
  } catch {
    return { title: 'Imóvel' }
  }
}

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id } = await params
  const property = await loadProperty(id)

  if (property === null) notFound()

  const title = formatTitle(property.title)
  const address = formatAddress(property)
  const attributes = formatAttributes(property)
  const amenities = toAmenityList(property.amenities)
  const description = formatDescription(property.description)

  return (
    <article className={styles.detail}>
      <Link className={styles.backLink} href="/imoveis">
        ← Voltar aos resultados
      </Link>

      <PropertyGallery title={title} photos={property.photos} />

      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.price}>{formatPrice(property.price)}</p>
        {address !== null && <p className={styles.address}>{address}</p>}
      </header>

      {attributes.length > 0 && (
        <section className={styles.section} aria-label="Características">
          <ul className={styles.attributes}>
            {attributes.map((attribute) => (
              <li key={attribute.key}>{attribute.text}</li>
            ))}
          </ul>
        </section>
      )}

      {amenities.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Comodidades</h2>
          <ul className={styles.amenities}>
            {amenities.map((amenity) => (
              <li key={amenity}>{amenity}</li>
            ))}
          </ul>
        </section>
      )}

      {description !== null && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Descrição</h2>
          <p className={styles.description}>{description}</p>
        </section>
      )}
    </article>
  )
}
