import './globals.css'
import type { Metadata } from 'next'
import SwRegister from '../components/SwRegister'

export const metadata: Metadata = { title: 'Pastel Flowers', description: 'Flower store MVP' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <SwRegister />
        {children}
      </body>
    </html>
  )
}
