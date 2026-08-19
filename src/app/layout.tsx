import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ImobHub",
    template: "%s | ImobHub",
  },
  description: "Busca de imóveis no ImobHub",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="brand">
              ImobHub
            </Link>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
