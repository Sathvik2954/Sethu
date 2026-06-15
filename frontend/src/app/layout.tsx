import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SETHU — CBIT Campus Management',
  description: 'Smart Education and Task Hub for Unified Campus Management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}