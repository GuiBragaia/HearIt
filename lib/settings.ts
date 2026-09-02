export type HearSettings = {
  volume: number
  autoplay: boolean
}

const KEY = 'hear-it-settings'
const DEFAULTS: HearSettings = { volume: 0.85, autoplay: false }

let current: HearSettings = { ...DEFAULTS }
const listeners = new Set<(next: HearSettings) => void>()
let booted = false

function clampVolume(value: number) {
  if (!Number.isFinite(value)) return DEFAULTS.volume
  return Math.min(1, Math.max(0, value))
}

function readStored(): HearSettings {
  if (typeof window === 'undefined') return { ...DEFAULTS }
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<HearSettings>
    return {
      volume: clampVolume(Number(parsed.volume ?? DEFAULTS.volume)),
      autoplay: parsed.autoplay === true,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function bootSettings() {
  if (typeof window === 'undefined') return current
  if (!booted) {
    current = readStored()
    booted = true
  }
  return current
}

export function getSettings() {
  if (!booted) return bootSettings()
  return current
}

export function setSettings(patch: Partial<HearSettings>) {
  current = {
    volume: patch.volume !== undefined ? clampVolume(patch.volume) : current.volume,
    autoplay: patch.autoplay ?? current.autoplay,
  }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(current))
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((fn) => fn(current))
}

export function subscribeSettings(listener: (next: HearSettings) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
