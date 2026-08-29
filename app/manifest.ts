import type { MetadataRoute } from 'next'
import { DEFAULT_DESCRIPTION, SITE_NAME } from '@/lib/seo'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Guess the song of the day`,
    short_name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    start_url: '/daily',
    scope: '/',
    display: 'standalone',
    background_color: '#070807',
    theme_color: '#070807',
    lang: 'en',
    categories: ['games', 'music', 'entertainment'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
