import Link from 'next/link'

export const metadata = {
  title: 'Detalhe do imóvel',
}

export default async function DetalheImovelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <section>
      <h1 className="page-title">Detalhe do imóvel</h1>
      <dl className="params-list">
        <div>
          <dt>id</dt>
          <dd>{id}</dd>
        </div>
      </dl>
      <ul className="nav-list">
        <li>
          <Link href="/imoveis">Voltar para os resultados</Link>
        </li>
        <li>
          <Link href="/">Voltar para a Home</Link>
        </li>
      </ul>
    </section>
  )
}
