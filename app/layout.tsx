import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Solstice — Solar System Visualisation',
  description: 'Interactive solar system visualisation with southern hemisphere perspective',
  manifest: '/manifest.json',
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
