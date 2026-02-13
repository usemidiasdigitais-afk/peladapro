import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pelada Pró - Painel Admin',
  description: 'Gerenciamento de partidas de futebol amador',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-light text-dark">{children}</body>
    </html>
  )
}
