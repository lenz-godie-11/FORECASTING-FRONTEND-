export default function RouteFallback() {
  return (
    <div className="route-fallback" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>Loading…</span>
    </div>
  )
}
