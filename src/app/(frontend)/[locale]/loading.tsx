export default function Loading() {
  return (
    <div aria-label="Loading" className="page-shell loading-shell" role="status">
      <div className="loading-line loading-nav" />
      <div className="loading-line loading-title" />
      <div className="loading-line loading-copy" />
      <div className="loading-grid">
        <div className="loading-image" />
        <div className="loading-image" />
      </div>
    </div>
  )
}
