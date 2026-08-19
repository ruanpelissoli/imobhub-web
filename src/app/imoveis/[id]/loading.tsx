export default function Loading() {
  return (
    <div className="property-loading" aria-busy="true" aria-live="polite">
      <p className="property-loading__text">Carregando imóvel…</p>
      <div className="property-loading__frame" />
      <div className="property-loading__block property-loading__block--title" />
      <div className="property-loading__block property-loading__block--price" />
      <div className="property-loading__block property-loading__block--line" />
      <div className="property-loading__attributes">
        <div className="property-loading__chip" />
        <div className="property-loading__chip" />
        <div className="property-loading__chip" />
        <div className="property-loading__chip" />
      </div>
    </div>
  )
}
