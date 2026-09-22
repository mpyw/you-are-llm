/** Everything the trainer can make a noise about. */
export type Cue = 'key' | 'miss' | 'combo' | 'clear' | 'finish'

interface Note {
  /** Pitch in hertz. */
  readonly hz: number
  /** Delay from the start of the cue, in seconds. */
  readonly at: number
  readonly length: number
  readonly gain: number
  readonly type: OscillatorType
}

/**
 * Cues are synthesised rather than loaded. A typing trainer fires one on every
 * keystroke, so the round trip to a file would be the slowest part of it, and
 * the whole set costs nothing to ship.
 */
const CUES: Readonly<Record<Cue, readonly Note[]>> = {
  key: [{ hz: 660, at: 0, length: 0.05, gain: 0.22, type: 'square' }],
  miss: [
    { hz: 120, at: 0, length: 0.16, gain: 0.5, type: 'sawtooth' },
    { hz: 84, at: 0, length: 0.16, gain: 0.4, type: 'sawtooth' },
  ],
  combo: [
    { hz: 880, at: 0, length: 0.07, gain: 0.3, type: 'triangle' },
    { hz: 1320, at: 0.055, length: 0.09, gain: 0.3, type: 'triangle' },
  ],
  clear: [
    { hz: 523.25, at: 0, length: 0.09, gain: 0.32, type: 'triangle' },
    { hz: 659.25, at: 0.07, length: 0.09, gain: 0.32, type: 'triangle' },
    { hz: 783.99, at: 0.14, length: 0.18, gain: 0.34, type: 'triangle' },
  ],
  finish: [
    { hz: 523.25, at: 0, length: 0.12, gain: 0.32, type: 'triangle' },
    { hz: 659.25, at: 0.1, length: 0.12, gain: 0.32, type: 'triangle' },
    { hz: 783.99, at: 0.2, length: 0.12, gain: 0.32, type: 'triangle' },
    { hz: 1046.5, at: 0.3, length: 0.45, gain: 0.36, type: 'triangle' },
  ],
}

const MASTER_GAIN = 0.18
const CENTS_PER_COMBO = 12
const COMBO_CEILING = 40

function audioContextCtor(): typeof AudioContext | undefined {
  return 'AudioContext' in globalThis ? globalThis.AudioContext : undefined
}

/**
 * Plays the cues. Silent and harmless wherever Web Audio is missing, which
 * covers tests and any browser that blocks it.
 */
export class SoundBoard {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private muted = false

  get isMuted(): boolean {
    return this.muted
  }

  mute(muted: boolean): void {
    this.muted = muted
    if (this.master !== null) this.master.gain.value = muted ? 0 : MASTER_GAIN
  }

  /**
   * `step` raises the pitch of a cue. The key click climbs with the combo, so
   * a run sounds like it is going somewhere.
   */
  play(cue: Cue, step = 0): void {
    if (this.muted) return
    const context = this.open()
    if (context === null || this.master === null) return
    const detune = Math.min(step, COMBO_CEILING) * CENTS_PER_COMBO
    for (const note of CUES[cue]) this.ring(context, this.master, note, detune)
  }

  private open(): AudioContext | null {
    if (this.context !== null) {
      if (this.context.state === 'suspended') void this.context.resume()
      return this.context
    }
    const Ctor = audioContextCtor()
    if (Ctor === undefined) return null
    try {
      const context = new Ctor()
      const master = context.createGain()
      master.gain.value = MASTER_GAIN
      master.connect(context.destination)
      this.context = context
      this.master = master
      return context
    } catch {
      // A browser that refuses to open an audio context just stays quiet.
      return null
    }
  }

  private ring(context: AudioContext, master: GainNode, note: Note, detune: number): void {
    const oscillator = context.createOscillator()
    const envelope = context.createGain()
    oscillator.type = note.type
    oscillator.frequency.value = note.hz
    oscillator.detune.value = detune

    const start = context.currentTime + note.at
    const end = start + note.length
    envelope.gain.setValueAtTime(0.0001, start)
    envelope.gain.linearRampToValueAtTime(note.gain, start + 0.008)
    envelope.gain.exponentialRampToValueAtTime(0.0001, end)

    oscillator.connect(envelope)
    envelope.connect(master)
    oscillator.start(start)
    oscillator.stop(end + 0.02)
  }
}

export const soundBoard = new SoundBoard()
