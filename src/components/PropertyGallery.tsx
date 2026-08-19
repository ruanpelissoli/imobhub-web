'use client'

import { useState } from 'react'
import {
  nextPhotoIndex,
  photoAlt,
  photoCounterLabel,
  prevPhotoIndex,
  toPhotoList,
} from './propertyGalleryState'

interface PropertyGalleryProps {
  title: string
  photos?: string[] | null
}

function GalleryPlaceholder({ message }: { message: string }) {
  return (
    <div className="property-gallery__placeholder">
      <svg
        className="property-gallery__placeholder-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="M21 15.5 16 11l-5.5 5.5L8 14l-5 4.5" />
      </svg>
      <p className="property-gallery__placeholder-text">{message}</p>
    </div>
  )
}

export default function PropertyGallery({
  title,
  photos,
}: PropertyGalleryProps) {
  const photoList = toPhotoList(photos)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [brokenPhotos, setBrokenPhotos] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  )

  const total = photoList.length
  const currentPhoto = photoList[currentIndex]
  const isBroken = currentPhoto !== undefined && brokenPhotos.has(currentPhoto)

  return (
    <section className="property-gallery" aria-label="Galeria de fotos">
      <div className="property-gallery__frame">
        {currentPhoto === undefined ? (
          <GalleryPlaceholder message="Sem fotos disponíveis" />
        ) : isBroken ? (
          <GalleryPlaceholder message="Foto indisponível" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- fotos vêm de hosts arbitrários de scraping e next.config.ts não tem images.remotePatterns
          <img
            className="property-gallery__image"
            src={currentPhoto}
            alt={photoAlt(title, currentIndex)}
            loading="lazy"
            onError={() =>
              setBrokenPhotos((previous) =>
                new Set(previous).add(currentPhoto),
              )
            }
          />
        )}
      </div>

      {total > 1 && (
        <div className="property-gallery__controls">
          <button
            type="button"
            className="property-gallery__button"
            aria-label="Foto anterior"
            onClick={() =>
              setCurrentIndex((index) => prevPhotoIndex(index, total))
            }
          >
            Anterior
          </button>

          <p className="property-gallery__counter" aria-live="polite">
            {photoCounterLabel(currentIndex, total)}
          </p>

          <button
            type="button"
            className="property-gallery__button"
            aria-label="Próxima foto"
            onClick={() =>
              setCurrentIndex((index) => nextPhotoIndex(index, total))
            }
          >
            Próximo
          </button>
        </div>
      )}
    </section>
  )
}
