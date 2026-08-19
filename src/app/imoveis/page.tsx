import Link from 'next/link'
import { toDisplayParams, type RawSearchParams } from './searchParams'

export const metadata = {
  title: 'Resultados',
}

export default async function ResultadosPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  const params = toDisplayParams(await searchParams)

  return (
    <section>
      <h1 className="page-title">Resultados</h1>

      {params.length === 0 ? (
        <p className="empty-state">Nenhum parâmetro de busca informado.</p>
      ) : (
        <dl className="params-list">
          {params.map(({ key, value }) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <ul className="nav-list">
        <li>
          <Link href="/imoveis/123">Ver detalhe do imóvel 123</Link>
        </li>
        <li>
          <Link href="/">Voltar para a Home</Link>
        </li>
      </ul>
    </section>
  )
}
