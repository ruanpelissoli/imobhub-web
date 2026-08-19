import Link from "next/link";

type SearchParams = Record<string, string | string[] | undefined>;

export const metadata = {
  title: "Resultados",
};

export default async function ResultadosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined,
  );

  return (
    <section>
      <h1 className="page-title">Resultados</h1>

      {entries.length === 0 ? (
        <p className="empty-state">Nenhum parâmetro de busca informado.</p>
      ) : (
        <dl className="params-list">
          {entries.map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{Array.isArray(value) ? value.join(", ") : value}</dd>
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
  );
}
