'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { normalizeGuess, songCoreTitle } from '@/lib/game'
import { guessFitsQuery } from '@/lib/catalog-quality'
import { catalogHits, type GuessHit } from '@/lib/guess-search'
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

function GuessArt({ src }: { src?: string | null }) {
  const [broken, setBroken] = useState(false)
  useEffect(() => {
    setBroken(false)
  }, [src])
  if (!src || broken) return <i className="guess-art is-empty" aria-hidden />
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="guess-art"
      src={src}
      alt=""
      width={36}
      height={36}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
    />
  )
}

const SUGGEST_MIN = 2

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
  const [remote, setRemote] = useState<GuessHit[]>([])
  const queryId = useRef(0)

  const local = useMemo(() => catalogHits(value), [value])

  const suggestions = useMemo(() => {
    const needle = normalizeGuess(value)
    const seen = new Set<string>()
    const out: GuessHit[] = []
    const remoteFit = remote.filter((hit) => needle.length < SUGGEST_MIN || guessFitsQuery(value, hit))
    for (const hit of [...local, ...remoteFit]) {
      const key = `${normalizeGuess(songCoreTitle(hit.title))}:${normalizeGuess(hit.artist)}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(hit)
    }
    return out.slice(0, 16)
  }, [local, remote, value])

  useEffect(() => {
    const query = value.trim()
    if (query.length < SUGGEST_MIN) {
      setRemote([])
      return
    }
    const id = (queryId.current += 1)
    const timer = window.setTimeout(() => {
      void fetch(`/api/guess?q=${encodeURIComponent(query)}`)
        .then((response) => response.json())
        .then((data: { hits?: GuessHit[] }) => {
          if (id === queryId.current) setRemote(data.hits ?? [])
        })
        .catch(() => {
          if (id !== queryId.current) return
        })
    }, 140)
    return () => window.clearTimeout(timer)
  }, [value])

  const pick = (hit: GuessHit) => {
    onSubmit(hit.title)
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
                const hit = suggestions[highlight]
                if (hit) pick(hit)
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
            {suggestions.map((hit, index) => (
              <li key={hit.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === highlight}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => pick(hit)}
                  className={index === highlight ? 'is-on' : undefined}
                >
                  <GuessArt src={hit.artwork} />
                  <span className="guess-copy">
                    <span>
                      <Marked text={hit.title} query={value} />
                    </span>
                    <small>
                      <Marked text={hit.artist} query={value} />
                      {hit.album ? ` · ${hit.album}` : null}
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
