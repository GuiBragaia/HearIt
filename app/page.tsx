import type { Metadata } from 'next'
import { LandingHero } from '@/components/landing/LandingHero'
import { LandingStory } from '@/components/landing/LandingStory'
import { JsonLd } from '@/components/seo/JsonLd'
import { homeJsonLd, pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata('home')

export default function HomePage() {
  return (
    <>
      <JsonLd data={homeJsonLd()} />
      <LandingHero />
      <LandingStory />
    </>
  )
}
