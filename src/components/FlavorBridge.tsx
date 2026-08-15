const relLabel: Record<string, string> = {
  PAIRS_WITH: "pairs with",
  SUBSTITUTES_FOR: "substitutes for",
};

export default function FlavorBridge({
  nodes,
  relTypes,
}: {
  nodes: { id: string; name: string }[];
  relTypes: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-y-6" role="list" aria-label="Flavor bridge path">
      {nodes.map((n, i) => (
        <div key={n.id} className="flex items-center" role="listitem">
          <div
            className="index-card rounded-full px-4 py-2 font-display text-lg relative"
            style={{ zIndex: 2 }}
          >
            {n.name}
            <span
              className="absolute -top-2 -left-1 w-2.5 h-2.5 rounded-full"
              style={{ background: "var(--pp-paprika)" }}
              aria-hidden
            />
          </div>
          {i < nodes.length - 1 && (
            <div className="flex flex-col items-center mx-1 sm:mx-2">
              <span
                className="font-utility text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full mb-1"
                style={{ background: "var(--pp-mustard)", color: "var(--pp-ink)" }}
              >
                {relLabel[relTypes[i]] ?? relTypes[i]}
              </span>
              <svg width="40" height="10" viewBox="0 0 40 10" aria-hidden>
                <line
                  x1="0"
                  y1="5"
                  x2="40"
                  y2="5"
                  stroke="var(--pp-parchment-dim)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
