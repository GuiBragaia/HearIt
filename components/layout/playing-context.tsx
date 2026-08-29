'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type Feel = 'miss' | 'hit' | 'perfect' | 'clutch' | null

type PlayingContextValue = {
  playing: boolean
  feel: Feel
  setPlaying: (value: boolean) => void
  setFeel: (value: Feel) => void
}

const PlayingContext = createContext<PlayingContextValue | null>(null)

export function PlayingProvider({ children }: { children: ReactNode }) {
  const [playing, setPlaying] = useState(false)
  const [feel, setFeel] = useState<Feel>(null)
  const value = useMemo(() => ({ playing, feel, setPlaying, setFeel }), [playing, feel])
  return <PlayingContext.Provider value={value}>{children}</PlayingContext.Provider>
}

export function usePlaying() {
  const ctx = useContext(PlayingContext)
  if (!ctx) throw new Error('usePlaying must be used within PlayingProvider')
  return ctx
}
