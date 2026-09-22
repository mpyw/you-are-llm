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
        <button
          type="button"
          className="sound-toggle"
          onClick={toggleMuted}
          aria-pressed={muted}
          title={muted ? 'Sound off' : 'Sound on'}
        >
          {muted ? 'Sound off' : 'Sound on'}
        </button>
      </nav>
      <Outlet />
    </div>
  )
}
