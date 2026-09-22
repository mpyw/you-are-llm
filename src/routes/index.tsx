import { Link, createFileRoute } from '@tanstack/react-router'
import type { CodeLanguage, Difficulty, Language, Session } from '../materials'
import {
  CODE_LANGUAGE_LABELS,
  DIFFICULTY_LABELS,
  isCodeLanguage,
  isDifficulty,
  isLanguage,
  sessions,
} from '../materials'
import { Demo } from '../typing/Demo'
import { toSteps } from '../typing/steps'

export interface Filters {
  // Optional on purpose: every link to this route may leave the search empty.
  readonly lang?: Language | undefined
  readonly difficulty?: Difficulty | undefined
  readonly code?: CodeLanguage | undefined
}

function pick<T extends string>(
  value: unknown,
  guard: (candidate: string) => candidate is T,
): T | undefined {
  return typeof value === 'string' && guard(value) ? value : undefined
}

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): Filters => ({
    lang: pick(search.lang, isLanguage),
    difficulty: pick(search.difficulty, isDifficulty),
    code: pick(search.code, isCodeLanguage),
  }),
  component: SessionList,
})

const LANGUAGE_LABELS: Readonly<Record<Language, string>> = { ja: '日本語', en: 'English' }

function matches(session: Session, filters: Filters): boolean {
  if (filters.lang !== undefined && session.language !== filters.lang) return false
  if (filters.difficulty !== undefined && session.difficulty !== filters.difficulty) return false
  if (filters.code !== undefined && session.codeLanguage !== filters.code) return false
  return true
}

/* The one line the front page has to land. */
const DEMO_BODY = '承知しました。正本を確認します。'
const DEMO_TARGET = 'しょうちしました。せいほんをかくにんします。'

function Hero() {
  const languages = new Set(sessions.map((session) => session.codeLanguage))
  return (
    <section className="hero">
      <p className="hero-kicker">A typing trainer</p>
      <h1 className="hero-title">You are LLM</h1>
      <p className="hero-lede">
        The assistant writes the code. You type every character of it, by hand, with no completion.
      </p>
      <Demo body={DEMO_BODY} target={DEMO_TARGET} />
      <p className="hero-stats">
        {sessions.length} sessions · {languages.size} languages · 3 difficulties · ja and en
      </p>
      <a className="hero-start" href="#sessions">
        Pick a session
      </a>
    </section>
  )
}

function SessionList() {
  const filters = Route.useSearch()
  const shown = sessions.filter((session) => matches(session, filters))

  return (
    <main className="list">
      <Hero />
      <h2 className="list-head" id="sessions">
        Sessions
      </h2>

      <div className="filters">
        <FilterRow label="Language" current={filters.lang} name="lang" options={LANGUAGE_LABELS} />
        <FilterRow
          label="Difficulty"
          current={filters.difficulty}
          name="difficulty"
          options={DIFFICULTY_LABELS}
        />
        <FilterRow label="Code" current={filters.code} name="code" options={CODE_LANGUAGE_LABELS} />
      </div>

      <p className="count">
        {shown.length} of {sessions.length}
      </p>

      {shown.length === 0 ? (
        <p className="summary">Nothing matches. Widen a filter.</p>
      ) : (
        <ul>
          {shown.map((session) => (
            <li key={session.id}>
              <Link to="/sessions/$sessionId" params={{ sessionId: session.id }}>
                <strong>{session.title}</strong>
                <span className="summary">{session.summary}</span>
                <span className="tags">
                  <span className="badge">{CODE_LANGUAGE_LABELS[session.codeLanguage]}</span>
                  <span className={`badge is-${session.difficulty}`}>
                    {DIFFICULTY_LABELS[session.difficulty]}
                  </span>
                  <span className="badge">{session.language}</span>
                  <span className="meta">{toSteps(session).length} steps</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

interface FilterRowProps<K extends string> {
  readonly label: string
  readonly name: 'lang' | 'difficulty' | 'code'
  readonly current: K | undefined
  readonly options: Readonly<Record<K, string>>
}

function FilterRow<K extends string>({ label, name, current, options }: FilterRowProps<K>) {
  const entries = Object.entries<string>(options)
  return (
    <div className="filter-row">
      <span className="filter-label">{label}</span>
      <Link
        to="/"
        search={(prev) => ({ ...prev, [name]: undefined })}
        className="chip"
        data-on={current === undefined}
      >
        All
      </Link>
      {entries.map(([key, label]) => (
        <Link
          key={key}
          to="/"
          search={(prev) => ({ ...prev, [name]: key })}
          className="chip"
          data-on={current === key}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}
