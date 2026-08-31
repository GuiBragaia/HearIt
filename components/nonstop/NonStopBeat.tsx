'use client'

import { motion, useReducedMotion } from 'motion/react'
import { PlaybackButton } from '@/components/audio/PlaybackButton'
import { ViewportWaveform } from '@/components/audio/ViewportWaveform'
import { AlbumCover } from '@/components/game/AlbumCover'
import { SaveTrackButton } from '@/components/game/SaveTrackButton'
import { LogoMark } from '@/components/layout/Logo'
import { useI18n } from '@/lib/i18n'
import type { HearTrack } from '@/lib/deezer'
import { cn } from '@/lib/utils'

export function NonStopBeat({
  won,
  track,
  named,
  playing,
  onTogglePlay,
  onNext,
}: {
  won: boolean
  track: HearTrack
  named: number
  playing: boolean
  onTogglePlay: () => void
  onNext: () => void
}) {
  const { t } = useI18n()
  const reduce = useReducedMotion()

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn('result-screen', won && 'is-win')}
    >
      <div className="result-mark" aria-hidden>
        <LogoMark size={220} />
      </div>
      <ViewportWaveform variant="horizon" hot={won && playing} />

      <div className="result-body">
        <p className={cn('result-kicker', won ? 'is-hit' : 'is-miss')}>
          {won ? t.game.youGotIt : t.game.failed}
        </p>
        <h2 className="result-title">{track.title}</h2>
        <p className="result-artist">{track.artist}</p>
        <AlbumCover src={track.artworkUrl} alt={`${track.title} — ${track.artist}`} won={won} playing={playing} />
        <div className="result-listen">
          <PlaybackButton playing={playing} onToggle={onTogglePlay} kind="song" />
          <SaveTrackButton id={track.id} title={track.title} artist={track.artist} artworkUrl={track.artworkUrl} />
        </div>
        <p className="result-note mt-6">
          {named} {named === 1 ? t.nonstop.namedOne : t.nonstop.named}
        </p>
        <div className="result-actions">
          <button type="button" onClick={onNext} className="shine-btn result-share">
            {t.nonstop.nextClip}
          </button>
        </div>
      </div>
    </motion.section>
  )
}
