import { Link, createFileRoute } from '@tanstack/react-router'
import { sessions } from '../materials'
import { toSteps } from '../typing/steps'

export const Route = createFileRoute('/')({
  component: SessionList,
})

function SessionList() {
  return (
    <main className="list">
      <h1>Sessions</h1>
      <p className="summary">Type the assistant side of a coding session. No completion.</p>
      <ul>
        {sessions.map((session) => (
          <li key={session.id}>
            <Link to="/sessions/$sessionId" params={{ sessionId: session.id }}>
              <span className="badge">{session.language}</span>
              <strong>{session.title}</strong>
              <span className="summary">{session.summary}</span>
              <span className="meta">{toSteps(session).length} steps</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
