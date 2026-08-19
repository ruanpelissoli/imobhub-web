import Link from 'next/link'

export default function HomePage() {
  return (
    <section>
      <h1 className="page-title">ImobHub</h1>
      <p>Busca de imóveis agregada de múltiplas imobiliárias.</p>
      <ul className="nav-list">
        <li>
          <Link href="/imoveis">Ver imóveis</Link>
        </li>
        <li>
          <Link href="/imoveis?cidade=curitiba&precoMax=500000">
            Ver imóveis em Curitiba até R$ 500.000
          </Link>
        </li>
      </ul>
    </section>
  )
}
