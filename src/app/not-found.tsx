import Link from 'next/link'

export const metadata = {
  title: 'Página não encontrada',
}

export default function NotFound() {
  return (
    <section>
      <h1 className="page-title">Página não encontrada</h1>
      <p>O endereço acessado não existe ou foi removido.</p>
      <ul className="nav-list">
        <li>
          <Link href="/">Voltar para a Home</Link>
        </li>
      </ul>
    </section>
  )
}
