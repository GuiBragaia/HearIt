import type { Metadata } from 'next'
import { absoluteUrl, siteUrl } from '@/lib/site'

export const SITE_NAME = 'Hear It'
export const SITE_TAGLINE_PT = 'Adivinhe a música do dia'
export const SITE_TAGLINE_EN = 'Guess the song of the day'

export const DEFAULT_TITLE = `${SITE_NAME} — ${SITE_TAGLINE_EN}`
export const DEFAULT_DESCRIPTION =
  'A daily music game. Hear a tiny clip and try to name the track. The less you need, the more you score. Free, a new song every day.'

const KEYWORDS = [
  'guess the song',
  'daily song quiz',
  'music quiz',
  'heardle',
  'Hear It',
  'song of the day',
  'adivinhe a música',
  'jogo de música',
  'quiz musical',
  'música do dia',
]

type PageKey =
  | 'home'
  | 'play'
  | 'daily'
  | 'plays'
  | 'online'
  | 'leaderboard'
  | 'join'
  | 'login'
  | 'profile'
  | 'callback'

const pages: Record<
  PageKey,
  {
    path: string
    title: string
    description: string
    index?: boolean
  }
> = {
  home: {
    path: '/',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  play: {
    path: '/play',
    title: 'Play',
    description:
      'Pick a mode: today’s song, Non-Stop, or Duel. Hear It is the game where you guess the track from a tiny clip.',
  },
  daily: {
    path: '/daily',
    title: 'Today’s song',
    description:
      'Today’s song on Hear It. Everyone hears the same clip. Name it with as little audio as you can and climb the board.',
  },
  plays: {
    path: '/plays',
    title: 'Non-Stop',
    description: 'Hear It’s unlimited mode: guess as many songs as you want, no waiting until tomorrow.',
  },
  online: {
    path: '/online',
    title: 'Duel',
    description: 'A Hear It duel: the same clip, two people. First to name the song wins.',
  },
  leaderboard: {
    path: '/leaderboard',
    title: 'Scores',
    description:
      'The Hear It board. See who named today’s song with the least audio — this week, this month, or all time.',
  },
  join: {
    path: '/join',
    title: 'Create account',
    description:
      'Create a Hear It account to keep points, streaks, and your place on the board. Today’s song is free to play.',
  },
  login: {
    path: '/login',
    title: 'Sign in',
    description: 'Sign in to Hear It to keep your streak and today’s score.',
  },
  profile: {
    path: '/profile',
    title: 'Your profile',
    description: 'Your ear on Hear It: points, friends, and favorite artists.',
    index: false,
  },
  callback: {
    path: '/auth/callback',
    title: 'Signing in',
    description: 'Connecting your Hear It account.',
    index: false,
  },
}

export function pageMetadata(key: PageKey): Metadata {
  const page = pages[key]
  const url = absoluteUrl(page.path)
  const index = page.index !== false
  const isHome = key === 'home'

  return {
    title: isHome ? { absolute: page.title } : page.title,
    description: page.description,
    alternates: { canonical: page.path },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      title: isHome ? page.title : `${page.title} · ${SITE_NAME}`,
      description: page.description,
      url,
      type: 'website',
      locale: 'en_US',
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: isHome ? page.title : `${page.title} · ${SITE_NAME}`,
      description: page.description,
    },
  }
}

export function profileMetadata(person: {
  name: string
  handle: string
  stats?: { points?: number; streak?: number }
}): Metadata {
  const handle = person.handle.startsWith('@') ? person.handle : `@${person.handle}`
  const name = person.name?.trim() || handle
  const title = `${name} on Hear It`
  const points = person.stats?.points
  const streak = person.stats?.streak
  const extra =
    typeof points === 'number'
      ? ` ${points} points${typeof streak === 'number' && streak > 0 ? `, ${streak}-day streak` : ''}.`
      : ''
  const description = `${name} (${handle}) plays Hear It, the daily game where you guess the song.${extra} Open the profile and try your ear.`
  const path = `/profile/${handle.replace(/^@/, '')}`

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} · ${SITE_NAME}`,
      description,
      url: absoluteUrl(path),
      type: 'profile',
    },
    twitter: { title, description },
  }
}

export function rootMetadata(): Metadata {
  const origin = siteUrl()
  return {
    metadataBase: new URL(origin),
    applicationName: SITE_NAME,
    title: {
      default: DEFAULT_TITLE,
      template: `%s · ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    keywords: KEYWORDS,
    authors: [{ name: SITE_NAME, url: origin }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: 'games',
    referrer: 'origin-when-cross-origin',
    formatDetection: { telephone: false, email: false, address: false },
    alternates: {
      canonical: '/',
      languages: {
        en: '/',
        'pt-BR': '/',
        'x-default': '/',
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      alternateLocale: ['pt_BR'],
      url: origin,
      siteName: SITE_NAME,
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    },
    twitter: {
      card: 'summary_large_image',
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    appleWebApp: {
      capable: true,
      title: SITE_NAME,
      statusBarStyle: 'black-translucent',
    },
  }
}

export function homeJsonLd() {
  const origin = siteUrl()
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: origin,
        inLanguage: ['en', 'pt-BR'],
        description: DEFAULT_DESCRIPTION,
      },
      {
        '@type': 'WebApplication',
        name: SITE_NAME,
        url: origin,
        applicationCategory: 'GameApplication',
        operatingSystem: 'Web',
        genre: ['Music', 'Trivia', 'Quiz'],
        inLanguage: ['en', 'pt-BR'],
        description: DEFAULT_DESCRIPTION,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is Hear It?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Hear It is a daily music game. You hear a tiny clip and try to name the song. Everyone gets the same track that day.',
            },
          },
          {
            '@type': 'Question',
            name: 'How do you play Hear It?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Play the clip, type the song title, send it. If you miss, you hear a little more. Less audio means more points.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is Hear It free?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Play today’s song as a guest. An account keeps points, streaks, and your place on the board.',
            },
          },
          {
            '@type': 'Question',
            name: 'A new song every day?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. One track a day, the same for every player, until the day turns.',
            },
          },
        ],
      },
    ],
  }
}

export const sitemapEntries = [
  { path: '/', changeFrequency: 'daily' as const, priority: 1 },
  { path: '/daily', changeFrequency: 'daily' as const, priority: 0.95 },
  { path: '/play', changeFrequency: 'weekly' as const, priority: 0.85 },
  { path: '/leaderboard', changeFrequency: 'daily' as const, priority: 0.8 },
  { path: '/join', changeFrequency: 'monthly' as const, priority: 0.6 },
  { path: '/plays', changeFrequency: 'weekly' as const, priority: 0.4 },
  { path: '/online', changeFrequency: 'weekly' as const, priority: 0.4 },
]
