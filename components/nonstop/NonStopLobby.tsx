'use client'

import { useCallback, useEffect, useState } from 'react'
import { ViewportWaveform } from '@/components/audio/ViewportWaveform'
import { useSession } from '@/components/auth/session-context'
import type { HearTrack } from '@/lib/deezer'
import { useI18n } from '@/lib/i18n'
import { prepareNonstopQueue } from '@/lib/nonstop-queue'
import { readHeardIds, rememberHeardIds } from '@/lib/nonstop-heard'
import { readNonstopStats } from '@/lib/nonstop-stats'
import { songForDay } from '@/lib/songs'
import { formatNumber } from '@/lib/utils'

export function NonStopLobby({ onPlay }: { onPlay: (tracks: HearTrack[]) => void }) {
  const { t, locale } = useI18n()
  const { user } = useSession()
  const dailySong = songForDay()
  const [stats, setStats] = useState({ best: 0, total: 0 })
  const [queue, setQueue] = useState<HearTrack[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [line, setLine] = useState(0)
  const favKey = (user?.favorites ?? []).join(',')
  const lines = t.nonstop.loadingLines

  const prepare = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const tracks = await prepareNonstopQueue({
        favs: favKey ? favKey.split(',') : [],
        exclude: dailySong.title,
        seen: user?.id ? readHeardIds(user.id) : [],
      })
      if (!tracks[0]) {
        setQueue(null)
        setFailed(true)
        return
      }
      setQueue(tracks)
      if (user?.id) rememberHeardIds(user.id, tracks.map((track) => track.id))
    } catch {
      setQueue(null)
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [dailySong.title, favKey, user?.id])

  useEffect(() => {
    if (!user?.id) return
    setStats(readNonstopStats(user.id))
  }, [user?.id])

  useEffect(() => {
    void prepare()
  }, [prepare])

  useEffect(() => {
    if (!loading) return
    const timer = window.setInterval(() => {
      setLine((value) => (value + 1) % lines.length)
    }, 1400)
    return () => window.clearInterval(timer)
  }, [loading, lines.length])

  return (
    <section className="developing-mode">
      <div className="developing-bg enter enter-2" aria-hidden>
        <ViewportWaveform />
      </div>
      <div className="developing-copy nonstop-lobby">
        <p className="enter enter-1 m-0 text-xs text-muted-foreground">{t.nav.plays}</p>
        <h1 className="enter enter-2 display mt-3 mb-0 text-[clamp(36px,7vw,56px)]">{t.nonstop.lobbyTitle}</h1>
        <p className="enter enter-3 mt-4 text-[15px] leading-6 text-muted-foreground">{t.nonstop.lobbyLead}</p>
        <ul className="enter enter-4 nonstop-how">
          <li>{t.nonstop.lobbyHear}</li>
          <li>{t.nonstop.lobbyName}</li>
          <li>{t.nonstop.lobbyStay}</li>
        </ul>
        <div className="enter enter-5 nonstop-stats">
          <p>
            <strong>{formatNumber(stats.best, locale)}</strong>
            <span>{t.nonstop.bestSession}</span>
            <small>{t.nonstop.bestHint}</small>
          </p>
          <p>
            <strong>{formatNumber(stats.total, locale)}</strong>
            <span>{t.nonstop.totalNamed}</span>
          </p>
        </div>
        {loading ? (
          <div className="nonstop-prep" role="status" aria-live="polite" aria-busy="true">
            <span className="hear-load-bars" aria-hidden>
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <em />
              <i />
            </span>
            <p>{lines[line] ?? t.nonstop.loading}</p>
          </div>
        ) : failed ? (
          <button type="button" onClick={() => void prepare()} className="enter enter-5 shine-btn nonstop-play">
            {t.nonstop.retry}
          </button>
        ) : (
          <button
            type="button"
            disabled={!queue?.[0]}
            onClick={() => {
              if (queue?.[0]) onPlay(queue)
            }}
            className="enter enter-5 shine-btn nonstop-play"
          >
            {t.nonstop.play}
          </button>
        )}
      </div>
    </section>
  )
}
