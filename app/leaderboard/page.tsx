import type { Metadata } from 'next'
import { Leaderboard } from '@/components/leaderboard/Leaderboard'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata('leaderboard')

export default function LeaderboardPage() {
  return <Leaderboard />
}
