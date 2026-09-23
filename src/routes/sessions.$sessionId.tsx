import { Link, createFileRoute } from '@tanstack/react-router'
import { loadSession } from '../materials'
import { SessionPlayer } from '../typing/SessionPlayer'

export const Route = createFileRoute('/sessions/$sessionId')({
  // Only the opened session's body is fetched. The list never loads any.
  loader: ({ params }) => loadSession(params.sessionId),
  component: SessionRoute,
})

function SessionRoute() {
  const session = Route.useLoaderData()

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
