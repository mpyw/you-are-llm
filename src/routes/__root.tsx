import { Link, Outlet, createRootRoute } from '@tanstack/react-router'
import '../styles.css'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="shell">
      <nav className="shell-nav">
        <Link to="/">You are LLM</Link>
      </nav>
      <Outlet />
    </div>
  )
}
