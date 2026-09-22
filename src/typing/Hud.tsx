import type { Tally } from './stats'
import { accuracy, formatDuration, keysPerMinute } from './stats'

interface HudProps {
  readonly combo: number
  readonly bestCombo: number
  readonly tally: Tally
  readonly step: number
  readonly total: number
}

export function Hud({ combo, bestCombo, tally, step, total }: HudProps) {
  return (
    <div className="hud">
      <Tile label="Combo" value={`×${String(combo)}`} pulse={combo} hot={combo >= 25} />
      <Tile label="Best" value={`×${String(bestCombo)}`} />
      <Tile label="Keys / min" value={String(keysPerMinute(tally))} />
      <Tile label="Accuracy" value={`${String(accuracy(tally))}%`} />
      <Tile label="Time" value={formatDuration(tally.elapsedMs)} />
      <Tile label="Step" value={`${String(Math.min(step + 1, total))} / ${String(total)}`} />
    </div>
  )
}

interface TileProps {
  readonly label: string
  readonly value: string
  /** Changing this replays the pop animation. */
  readonly pulse?: number
  readonly hot?: boolean
}

function Tile({ label, value, pulse, hot = false }: TileProps) {
  return (
    <div className="hud-tile" data-hot={hot}>
      <span className="hud-label">{label}</span>
      <span className="hud-value" key={pulse}>
        {value}
      </span>
    </div>
  )
}
