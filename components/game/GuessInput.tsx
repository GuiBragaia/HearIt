'use client'

import { useMemo, useState } from 'react'
import { catalog, type Song } from '@/lib/mock'
import { normalizeGuess } from '@/lib/game'
import { useI18n } from '@/lib/i18n'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function Marked({ text, query }: { text: string; query: string }) {
  const needle = query.trim()
  if (!needle) return text
  const parts = text.split(new RegExp(`(${escapeRegExp(needle)})`, 'i'))
  if (parts.length === 1) return text
  return parts.map((part, index) =>
    part.toLowerCase() === needle.toLowerCase() ? <em key={index}>{part}</em> : part,
  )
}

const SUGGEST_MIN = 3

function wordsOf(value: string) {
  return value.split(' ').filter(Boolean)
}

function startsAWord(hay: string, query: string) {
  return wordsOf(hay).some((word) => word.startsWith(query))
}

function matchScore(song: Song, query: string) {
  if (query.length < SUGGEST_MIN) return 0

  const title = normalizeGuess(song.title)
  const artist = normalizeGuess(song.artist)
  const aliases = song.aliases.map(normalizeGuess)
  const hay = `${title} ${artist}`
  let score = 0

  if (title === query || aliases.includes(query)) score += 8
  if (title.startsWith(query)) score += 5
  if (startsAWord(title, query)) score += 4
  if (startsAWord(artist, query) || artist.startsWith(query)) score += 4

  if (query.length >= 4) {
    if (title.includes(query)) score += 2
    if (artist.includes(query)) score += 2
    if (aliases.some((alias) => alias.includes(query) || startsAWord(alias, query))) score += 2
  }

  const parts = wordsOf(query)
  if (parts.length > 1 && parts.every((part) => startsAWord(hay, part) || hay.includes(part))) score += 3

  return score
}

export function GuessInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: (next?: string) => void
  disabled?: boolean
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)

  const suggestions = useMemo(() => {
    const query = normalizeGuess(value)
    if (query.length < SUGGEST_MIN) return [] as Song[]
    return catalog
      .map((song) => ({ song, score: matchScore(song, query) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.song.title.localeCompare(b.song.title))
      .slice(0, 6)
      .map((item) => item.song)
  }, [value])

  const pick = (song: Song) => {
    onChange(song.title)
    setOpen(false)
  }

  const showList = open && !disabled && suggestions.length > 0

  return (
    <div className="guess-field">
      <label htmlFor="guess" className="mb-3 block text-sm font-medium">
        {t.game.guessLabel}
      </label>
      <div className="guess-box">
        <div className="flex gap-2">
          <input
            id="guess"
            value={value}
            disabled={disabled}
            autoComplete="off"
            placeholder={t.game.guessPlaceholder}
            aria-autocomplete="list"
            aria-expanded={showList}
            aria-controls="guess-list"
            onChange={(event) => {
              onChange(event.target.value)
              setOpen(true)
              setHighlight(0)
            }}
            onFocus={() => {
              if (normalizeGuess(value).length >= SUGGEST_MIN) setOpen(true)
            }}
            onBlur={() => window.setTimeout(() => setOpen(false), 160)}
            onKeyDown={(event) => {
              if (!showList) {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  onSubmit()
                }
                return
              }
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setHighlight((current) => Math.min(current + 1, suggestions.length - 1))
              } else if (event.key === 'ArrowUp') {
                event.preventDefault()
                setHighlight((current) => Math.max(current - 1, 0))
              } else if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                event.preventDefault()
                const song = suggestions[highlight]
                if (song) onSubmit(song.title)
              } else if (event.key === 'Escape') {
                setOpen(false)
              }
            }}
            className="min-w-0 flex-1 rounded-lg border border-input bg-[#0d100d] px-4 py-3.5 text-[15px] outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => onSubmit()}
            disabled={disabled || !value.trim()}
            className="rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            {t.game.guess}
          </button>
        </div>
        {showList ? (
          <ul id="guess-list" className="guess-list" role="listbox">
            {suggestions.map((song, index) => (
              <li key={song.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === highlight}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => pick(song)}
                  className={index === highlight ? 'is-on' : undefined}
                >
                  <span>
                    <Marked text={song.title} query={value} />
                  </span>
                  <small>
                    <Marked text={song.artist} query={value} />
                  </small>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
