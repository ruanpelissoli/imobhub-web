'use client'

import { useState } from 'react'
import styles from './PropertyGallery.module.css'
import { isBrokenImage } from './imageFallback'
import {
  nextPhotoIndex,
  photoAlt,
  photoCounterLabel,
  prevPhotoIndex,
  toPhotoList,
} from './propertyGalleryState'

export interface PropertyGalleryProps {
  title: string
  photos?: string[] | null
}

function GalleryPlaceholder({ message }: { message: string }) {
  return (
    <div className={styles.placeholder}>
      <svg
        className={styles.placeholderIcon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
        <path d="M10 21v-6h4v6" />
      </svg>
      <p>{message}</p>
    </div>
  )
}

export function PropertyGallery({ title, photos }: PropertyGalleryProps) {
  const photoList = toPhotoList(photos)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [brokenPhotos, setBrokenPhotos] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  )

  const total = photoList.length
  const currentPhoto = photoList[currentIndex]
  const isCurrentBroken =
    currentPhoto !== undefined && brokenPhotos.has(currentPhoto)

  const markBroken = (url: string) =>
    setBrokenPhotos((previous) =>
      previous.has(url) ? previous : new Set(previous).add(url),
    )

  // O <img> vem no HTML do servidor e pode falhar antes da hidratação anexar o
  // onError; o ref pega essa falha já ocorrida, o onError pega as posteriores.
  const detectBrokenOnMount = (node: HTMLImageElement | null) => {
    if (currentPhoto !== undefined && isBrokenImage(node)) markBroken(currentPhoto)
  }

  return (
    <section className={styles.gallery} aria-label="Galeria de fotos">
      <div className={styles.frame}>
        {currentPhoto === undefined ? (
          <GalleryPlaceholder message="Sem fotos disponíveis" />
        ) : isCurrentBroken ? (
          <GalleryPlaceholder message="Foto indisponível" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- fotos vêm de hosts arbitrários de scraping; next/image exigiria remotePatterns fechado
          <img
            ref={detectBrokenOnMount}
            className={styles.photo}
            src={currentPhoto}
            alt={photoAlt(title, currentIndex)}
            loading="lazy"
            decoding="async"
            onError={() => markBroken(currentPhoto)}
          />
        )}
      </div>

      {total > 1 && (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.button}
            aria-label="Ver foto anterior"
            onClick={() =>
              setCurrentIndex((index) => prevPhotoIndex(index, total))
            }
          >
            Anterior
          </button>

          <p className={styles.counter} aria-live="polite">
            {photoCounterLabel(currentIndex, total)}
          </p>

          <button
            type="button"
            className={styles.button}
            aria-label="Ver próxima foto"
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
