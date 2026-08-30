import type { Metadata } from 'next'
import { NonStopScreen } from '@/components/nonstop/NonStopScreen'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata('plays')

export default function PlaysPage() {
  return <NonStopScreen />
}
