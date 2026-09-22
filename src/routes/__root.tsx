import { Link, Outlet, createRootRoute } from '@tanstack/react-router'
import { soundBoard } from '../audio/SoundBoard'
import { useMuted } from '../audio/useMuted'
import { Logo } from '../ui/Logo'
import '../styles.css'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const [muted, toggleMuted] = useMuted(soundBoard)

  return (
    <div className="shell">
      <nav className="shell-nav">
        <Link to="/" className="brand">
          <Logo />
          <span>You are LLM</span>
        </Link>
        <div className="shell-tools">
          <a
            className="nav-chip"
            href="https://github.com/mpyw/you-are-llm"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <button
            type="button"
            className="nav-chip is-sound"
            onClick={toggleMuted}
            aria-pressed={muted}
            title={muted ? 'Sound off' : 'Sound on'}
          >
            {muted ? 'Sound off' : 'Sound on'}
          </button>
        </div>
      </nav>
      <Outlet />
    </div>
  )
}
