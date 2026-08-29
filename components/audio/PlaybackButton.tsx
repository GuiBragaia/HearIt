'use client'

import { Pause, Play } from 'lucide-react'
import { motion } from 'motion/react'
import { useI18n } from '@/lib/i18n'

export function PlaybackButton({
  playing,
  onToggle,
  kind = 'clip',
}: {
  playing: boolean
  onToggle: () => void
  kind?: 'clip' | 'song'
}) {
  const { t } = useI18n()
  const label = playing ? t.game.pause : kind === 'song' ? t.game.listen : t.game.playClip

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.96 }}
      className="shine-btn relative flex h-11 min-w-[132px] items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
    >
      {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
      {label}
    </motion.button>
  )
}
