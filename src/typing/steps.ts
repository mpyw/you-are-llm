import type { Block, Session } from '../materials'

/** One block of one assistant turn, which is one run of the typing engine. */
export interface Step {
  readonly turnIndex: number
  readonly blockIndex: number
  /** The user prompt, carried on the first block of a turn and null after it. */
  readonly prompt: string | null
  readonly block: Block
  /** Keys the typist has to produce. Japanese prose types its kana reading. */
  readonly target: string
}

export function toSteps(session: Session): readonly Step[] {
  return session.turns.flatMap((turn, turnIndex) =>
    turn.assistant.map((block, blockIndex) => ({
      turnIndex,
      blockIndex,
      prompt: blockIndex === 0 ? turn.user : null,
      block,
      target: block.reading ?? block.body,
    })),
  )
}
