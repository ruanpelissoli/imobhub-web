'use client'

import { useState } from 'react'
import styles from './PropertyCard.module.css'

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
  const [failed, setFailed] = useState(false)

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
        className={styles.photo}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
