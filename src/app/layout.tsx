import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ImobHub',
  description: 'Busca de imóveis agregada de múltiplas imobiliárias',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
