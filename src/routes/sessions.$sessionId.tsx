import { Link, createFileRoute } from '@tanstack/react-router'
import { findSession } from '../materials'
import { SessionPlayer } from '../typing/SessionPlayer'

export const Route = createFileRoute('/sessions/$sessionId')({
  component: SessionRoute,
})

function SessionRoute() {
  const { sessionId } = Route.useParams()
  const session = findSession(sessionId)

  if (session === undefined) {
    return (
      <main className="list">
        <h1>No such session</h1>
        <p className="summary">
          <Link to="/">Back to the list</Link>
        </p>
      </main>
    )
  }

  return <SessionPlayer session={session} />
}
