import Link from 'next/link'
import type { Property } from '@/lib/types'
import { PropertyImage } from './PropertyImage'
import styles from './PropertyCard.module.css'
import {
  buildAttributes,
  formatLocation,
  formatPrice,
  getPrimaryPhoto,
} from './propertyCard.format'

export interface PropertyCardProps {
  property: Property
}

export function PropertyCard({ property }: PropertyCardProps) {
  const attributes = buildAttributes(property)
  const location = formatLocation(property.neighborhood, property.city)

  return (
    <Link href={`/imoveis/${property.id}`} className={styles.card}>
      <article>
        <PropertyImage src={getPrimaryPhoto(property.photos)} alt={property.title} />

        <div className={styles.body}>
          <p className={styles.price}>{formatPrice(property.price)}</p>
          <h3 className={styles.title}>{property.title}</h3>
          {location.length > 0 && <p className={styles.location}>{location}</p>}

          {attributes.length > 0 && (
            <ul className={styles.attributes}>
              {attributes.map(({ key, label }) => (
                <li key={key}>{label}</li>
              ))}
            </ul>
          )}
        </div>
      </article>
    </Link>
  )
}

export default PropertyCard
