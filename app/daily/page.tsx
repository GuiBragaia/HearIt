import type { Metadata } from 'next'
import { GameBoard } from '@/components/game/GameBoard'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata('daily')

export default function DailyPage() {
  return <GameBoard />
}
