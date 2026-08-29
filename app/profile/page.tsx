import type { Metadata } from 'next'
import { ProfileScreen } from '@/components/profile/ProfileScreen'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata('profile')

export default function ProfilePage() {
  return <ProfileScreen />
}
