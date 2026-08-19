import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PropertyGallery from '@/components/PropertyGallery'
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
    <article className="property-detail">
      <Link className="property-back-link" href="/imoveis">
        ← Voltar aos resultados
      </Link>

      <PropertyGallery title={title} photos={property.photos} />

      <header className="property-detail__header">
        <h1 className="page-title">{title}</h1>
        <p className="property-detail__price">{formatPrice(property.price)}</p>
        {address !== null && (
          <p className="property-detail__address">{address}</p>
        )}
      </header>

      {attributes.length > 0 && (
        <section className="property-section" aria-label="Características">
          <ul className="property-attributes">
            {attributes.map((attribute) => (
              <li className="property-attributes__item" key={attribute.key}>
                {attribute.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {amenities.length > 0 && (
        <section className="property-section">
          <h2 className="property-section__title">Comodidades</h2>
          <ul className="property-amenities">
            {amenities.map((amenity) => (
              <li className="property-amenities__item" key={amenity}>
                {amenity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {description !== null && (
        <section className="property-section">
          <h2 className="property-section__title">Descrição</h2>
          <p className="property-description">{description}</p>
        </section>
      )}
    </article>
  )
}
