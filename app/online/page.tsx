import type { Metadata } from 'next'
import { DevelopingMode } from '@/components/modes/DevelopingMode'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata('online')

export default function OnlinePage() {
  return <DevelopingMode mode="online" />
}
