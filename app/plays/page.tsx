import type { Metadata } from 'next'
import { DevelopingMode } from '@/components/modes/DevelopingMode'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata('plays')

export default function PlaysPage() {
  return <DevelopingMode mode="plays" />
}
