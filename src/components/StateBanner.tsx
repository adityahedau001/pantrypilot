export function DatabaseUnavailableBanner() {
  return (
    <div
      className="index-card rounded-lg p-6 text-center"
      role="alert"
    >
      <p className="font-display text-xl mb-1">The pantry shelf is unreachable</p>
      <p className="text-sm" style={{ color: "var(--pp-ink-soft)" }}>
        PantryPilot can&apos;t reach the CognoDB instance right now. Check that your instance is
        running and that <code className="font-utility">COGNODB_URI</code>,{" "}
        <code className="font-utility">COGNODB_USER</code> and{" "}
        <code className="font-utility">COGNODB_PASSWORD</code> are set correctly, then try again.
      </p>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="index-card rounded-lg p-6 text-center">
      <p className="font-display text-xl mb-1">{title}</p>
      <p className="text-sm" style={{ color: "var(--pp-ink-soft)" }}>
        {body}
      </p>
    </div>
  );
}

export function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy aria-label="Loading recipes">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg p-5 h-40 animate-pulse"
          style={{ background: "var(--pp-shelf-raised)" }}
        />
      ))}
    </div>
  );
}
