'use client'

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="error-state">
      <p>Content is temporarily unavailable.</p>
      <button onClick={reset} type="button">
        Try again
      </button>
    </div>
  )
}
