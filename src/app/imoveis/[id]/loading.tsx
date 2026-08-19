import styles from './propertyDetail.module.css'

export default function Loading() {
  return (
    <div className={styles.loading} aria-busy="true" aria-live="polite">
      <p className={styles.loadingText}>Carregando imóvel…</p>
      <div className={styles.loadingFrame} />
      <div className={`${styles.loadingBlock} ${styles.loadingBlockTitle}`} />
      <div className={`${styles.loadingBlock} ${styles.loadingBlockPrice}`} />
      <div className={styles.loadingBlock} />
      <div className={styles.loadingAttributes}>
        <div className={styles.loadingChip} />
        <div className={styles.loadingChip} />
        <div className={styles.loadingChip} />
        <div className={styles.loadingChip} />
      </div>
    </div>
  )
}
