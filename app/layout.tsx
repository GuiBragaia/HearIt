import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Geist_Mono, Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { rootMetadata } from '@/lib/seo'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
})

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = rootMetadata()

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#070807',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${display.variable} ${mono.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
