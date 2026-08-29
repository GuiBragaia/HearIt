import type { Metadata } from 'next'
import { PlayHub } from '@/components/home/PlayHub'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata('play')

export default function PlayPage() {
  return <PlayHub />
}
