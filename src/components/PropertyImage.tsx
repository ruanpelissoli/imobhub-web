'use client'

import { useState } from 'react'
import styles from './PropertyCard.module.css'
import { isBrokenImage } from './propertyCard.format'

export interface PropertyImageProps {
  src: string | null
  alt: string
}

function Placeholder() {
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
    </div>
  )
}

export function PropertyImage({ src, alt }: PropertyImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = src !== null && src === failedSrc

  // O <img> vem no HTML do servidor e pode falhar antes da hidratação anexar o
  // onError; o ref pega essa falha já ocorrida, o onError pega as posteriores.
  const detectBrokenOnMount = (node: HTMLImageElement | null) => {
    if (isBrokenImage(node)) setFailedSrc(src)
  }

  if (!src || failed) {
    return (
      <div className={styles.media}>
        <Placeholder />
      </div>
    )
  }

  return (
    <div className={styles.media}>
      {/* eslint-disable-next-line @next/next/no-img-element -- fotos vêm de hosts arbitrários de scraping; next/image exigiria remotePatterns fechado */}
      <img
        ref={detectBrokenOnMount}
        className={styles.photo}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailedSrc(src)}
      />
    </div>
  )
}
