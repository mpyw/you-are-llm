import type { Block, Session } from '../materials'

/** One block of one assistant turn, which is one run of the typing engine. */
export interface Step {
  readonly turnIndex: number
  readonly blockIndex: number
  /** The user prompt for this turn. Every block of the turn carries it, because
   * the stage shows one block at a time and the prompt has to stay visible. */
  readonly prompt: string
  readonly block: Block
  /** Keys the typist has to produce. Japanese prose types its kana reading. */
  readonly target: string
}

export function toSteps(session: Session): readonly Step[] {
  return session.turns.flatMap((turn, turnIndex) =>
    turn.assistant.map((block, blockIndex) => ({
      turnIndex,
      blockIndex,
      prompt: turn.user,
      block,
      target: block.reading ?? block.body,
    })),
  )
}
