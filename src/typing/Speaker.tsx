export type Who = 'human' | 'assistant'

const FACES: Readonly<Record<Who, string>> = {
  human: '\u{1f9d1}‍\u{1f4bb}',
  assistant: '\u{1f916}',
}

const NAMES: Readonly<Record<Who, string>> = {
  human: 'You',
  assistant: 'Assistant',
}

/** The little avatar in front of a line, with a name for anyone not seeing it. */
export function Speaker({ who }: { readonly who: Who }) {
  return (
    <span className="speaker" data-who={who}>
      <span aria-hidden="true">{FACES[who]}</span>
      <span className="sr-only">{NAMES[who]}</span>
    </span>
  )
}
