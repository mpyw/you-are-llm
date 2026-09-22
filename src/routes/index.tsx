import { Link, createFileRoute } from '@tanstack/react-router'
import type { Language } from '../materials'
import { ANY, CODE_LANGUAGE_LABELS, DIFFICULTY_LABELS, filtersFrom, matches, sessions } from '../materials'
import { Demo } from '../typing/Demo'
import { Logo } from '../ui/Logo'
import { toSteps } from '../typing/steps'

export const Route = createFileRoute('/')({
  validateSearch: filtersFrom,
  component: SessionList,
})

const LANGUAGE_LABELS: Readonly<Record<Language, string>> = { ja: '日本語', en: 'English' }

/* The one line the front page has to land. */
const DEMO_BODY = '承知しました。正本を確認します。'
const DEMO_TARGET = 'しょうちしました。せいほんをかくにんします。'

function Hero() {
  const languages = new Set(sessions.map((session) => session.codeLanguage))
  const tiers = new Set(sessions.map((session) => session.difficulty))
  return (
    <section className="hero">
      <p className="hero-kicker">A typing trainer</p>
      <h1 className="hero-title">
        <Logo size={52} />
        <span>You are LLM</span>
      </h1>
      <p className="hero-lede">
        The assistant writes the code. You type every character of it, by hand, with no completion.
      </p>
      <Demo body={DEMO_BODY} target={DEMO_TARGET} />
      <p className="hero-stats">
        {sessions.length} sessions · {languages.size} languages · {tiers.size} difficulties · ja
        and en
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
        <FilterRow
          label="Language"
          current={filters.lang}
          name="lang"
          options={LANGUAGE_LABELS}
          anyValue={ANY}
        />
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
  readonly current: K | typeof ANY | undefined
  readonly options: Readonly<Record<K, string>>
  /** What "All" puts in the address. Language needs a word, because empty means Japanese. */
  readonly anyValue?: typeof ANY | undefined
}

function FilterRow<K extends string>({
  label,
  name,
  current,
  options,
  anyValue,
}: FilterRowProps<K>) {
  const entries = Object.entries<string>(options)
  return (
    <div className="filter-row">
      <span className="filter-label">{label}</span>
      <Link
        to="/"
        search={(prev) => ({ ...prev, [name]: anyValue })}
        className="chip"
        data-on={current === anyValue}
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
