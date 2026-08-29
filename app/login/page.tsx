import type { Metadata } from 'next'
import { AuthScreen } from '@/components/auth/AuthScreen'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata('login')

export default function LoginPage() {
  return <AuthScreen mode="login" />
}
