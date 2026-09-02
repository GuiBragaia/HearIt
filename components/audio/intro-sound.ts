import { getSettings } from '@/lib/settings'

type AudioCtxCtor = typeof AudioContext

function AudioCtor(): AudioCtxCtor | undefined {
  return window.AudioContext || (window as Window & { webkitAudioContext?: AudioCtxCtor }).webkitAudioContext
}

function tone(
  ctx: AudioContext,
  dest: AudioNode,
  {
    type = 'sine',
    freq,
    freqTo,
    time,
    dur,
    gain = 0.08,
    attack = 0.012,
    pan = 0,
  }: {
    type?: OscillatorType
    freq: number
    freqTo?: number
    time: number
    dur: number
    gain?: number
    attack?: number
    pan?: number
  },
) {
  if (time + dur <= ctx.currentTime) return

  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  const panner = ctx.createStereoPanner()
  osc.type = type
  osc.frequency.setValueAtTime(freq, time)
  if (freqTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqTo), time + dur)
  panner.pan.value = pan
  const peak = Math.max(0.0001, gain)
  amp.gain.setValueAtTime(0.0001, time)
  amp.gain.exponentialRampToValueAtTime(peak, time + attack)
  amp.gain.exponentialRampToValueAtTime(0.0001, time + dur)
  osc.connect(amp)
  amp.connect(panner)
  panner.connect(dest)
  osc.start(time)
  osc.stop(time + dur + 0.02)
}

function noiseBed(ctx: AudioContext, dest: AudioNode, time: number, dur: number) {
  const length = Math.floor(ctx.sampleRate * dur)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    const env = Math.sin((Math.PI * i) / length)
    data[i] = (Math.random() * 2 - 1) * env * 0.45
  }

  const src = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const amp = ctx.createGain()
  src.buffer = buffer
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(420, time)
  filter.frequency.exponentialRampToValueAtTime(1800, time + dur * 0.55)
  filter.Q.value = 0.7
  amp.gain.setValueAtTime(0.0001, time)
  amp.gain.exponentialRampToValueAtTime(0.1, time + 0.28)
  amp.gain.exponentialRampToValueAtTime(0.0001, time + dur)
  src.connect(filter)
  filter.connect(amp)
  amp.connect(dest)
  src.start(time)
  src.stop(time + dur)
}

const MASTER_GAIN = 2.2

export function playIntroSound(ctx: AudioContext, offset = 0) {
  const master = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 3400
  master.gain.value = MASTER_GAIN * (0.25 + getSettings().volume * 0.75)
  filter.connect(master)
  master.connect(ctx.destination)

  const at = (visual: number) => ctx.currentTime + Math.max(0, visual - offset)
  const due = (visual: number) => visual >= offset - 0.05

  if (due(0)) noiseBed(ctx, filter, at(0), 2.4)

  const bars = [220, 330, 440, 554, 659, 784, 880]
  bars.forEach((freq, index) => {
    const visual = 0.1 + index * 0.055
    if (!due(visual)) return
    const pan = -0.55 + (index / (bars.length - 1)) * 0.9
    tone(ctx, filter, {
      freq,
      time: at(visual),
      dur: 0.16,
      gain: 0.1,
      pan,
    })
  })

  if (due(0.18)) {
    tone(ctx, filter, {
      type: 'triangle',
      freq: 164,
      freqTo: 784,
      time: at(0.18),
      dur: 1.18,
      gain: 0.08,
      attack: 0.08,
    })
  }

  if (due(0.56)) {
    tone(ctx, filter, { freq: 1108, time: at(0.56), dur: 0.55, gain: 0.16, attack: 0.008, pan: 0.42 })
    tone(ctx, filter, { type: 'triangle', freq: 554, time: at(0.56), dur: 0.7, gain: 0.12, attack: 0.02 })
  }

  if (due(0.92)) {
    tone(ctx, filter, { freq: 1760, time: at(0.92), dur: 0.22, gain: 0.07, attack: 0.006 })
  }

  if (due(1.12)) {
    tone(ctx, filter, { type: 'triangle', freq: 220, time: at(1.12), dur: 1.7, gain: 0.13, attack: 0.18 })
    tone(ctx, filter, { freq: 329.63, time: at(1.12), dur: 1.6, gain: 0.1, attack: 0.22 })
  }

  if (due(1.32)) {
    tone(ctx, filter, { freq: 880, time: at(1.32), dur: 1.35, gain: 0.18, attack: 0.01 })
    tone(ctx, filter, { freq: 1318.5, time: at(1.32), dur: 1.1, gain: 0.11, attack: 0.012, pan: 0.2 })
    tone(ctx, filter, { type: 'triangle', freq: 440, time: at(1.32), dur: 1.55, gain: 0.12, attack: 0.04 })
  }

  return master
}

export function fadeIntroSound(master: GainNode | null, ctx: AudioContext | null) {
  if (!master || !ctx || ctx.state === 'closed') return
  const now = ctx.currentTime
  try {
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(MASTER_GAIN, now)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)
  } catch {
    /* context already closing */
  }
}

export function createIntroAudioContext() {
  const Ctor = AudioCtor()
  if (!Ctor) return null
  return new Ctor()
}
