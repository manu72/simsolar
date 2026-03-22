import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SimSolar — Solstice & Equinox',
  description: 'Interactive solar system visualisation with southern hemisphere perspective',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white overflow-hidden">
        {children}
      </body>
    </html>
  )
}
