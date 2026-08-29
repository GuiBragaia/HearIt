import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata('callback')

export default function AuthCallbackLayout({ children }: { children: React.ReactNode }) {
  return children
}
