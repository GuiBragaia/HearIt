import type { Metadata } from 'next'
import { PublicProfile } from '@/components/profile/PublicProfile'
import { fetchPerson, fetchProfileByHandle } from '@/lib/db'
import { pageMetadata, profileMetadata } from '@/lib/seo'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  if (!id || id === 'you') return pageMetadata('profile')
  const person = UUID.test(id) ? await fetchPerson(id) : await fetchProfileByHandle(id)
  if (!person) {
    return {
      title: 'Profile',
      robots: { index: false, follow: true },
    }
  }
  return profileMetadata(person)
}

export default function PublicProfilePage() {
  return <PublicProfile />
}
