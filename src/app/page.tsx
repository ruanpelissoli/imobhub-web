import SearchBar from '@/components/SearchBar'

export default function HomePage() {
  return (
    <section className="home-hero">
      <h1 className="page-title">Encontre seu imóvel ideal</h1>
      <p className="home-hero__subtitle">
        Imóveis de várias imobiliárias reunidos em um só lugar. Busque por cidade,
        bairro ou palavra-chave.
      </p>
      <SearchBar />
    </section>
  )
}
