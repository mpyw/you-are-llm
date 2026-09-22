import type { CSSProperties } from 'react'

type ParticleStyle = CSSProperties & Record<'--dx' | '--dy' | '--delay', string>

const COUNT = 14
const RADIUS = 120

/** Fixed angles rather than random ones, so a replay looks the same every time. */
const PARTICLES: readonly ParticleStyle[] = Array.from({ length: COUNT }, (_, index) => {
  const angle = (index / COUNT) * Math.PI * 2
  const reach = RADIUS * (index % 3 === 0 ? 1 : 0.7)
  return {
    '--dx': `${String(Math.round(Math.cos(angle) * reach))}px`,
    '--dy': `${String(Math.round(Math.sin(angle) * reach))}px`,
    '--delay': `${String((index % 4) * 20)}ms`,
  }
})

/** Fires once per change of `trigger`. Remounting is what replays it. */
export function Burst({ trigger }: { readonly trigger: number }) {
  if (trigger === 0) return null
  return (
    <div className="burst" key={trigger} aria-hidden="true">
      {PARTICLES.map((style, index) => (
        <span key={index} style={style} />
      ))}
    </div>
  )
}
