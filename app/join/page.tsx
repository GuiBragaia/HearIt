import type { Metadata } from 'next'
import { AuthScreen } from '@/components/auth/AuthScreen'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata('join')

export default function JoinPage() {
  return <AuthScreen mode="join" />
}
