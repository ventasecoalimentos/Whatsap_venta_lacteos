export function SkeletonKpis() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-verde-oscuro/10 bg-white p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 flex-shrink-0 rounded-xl bg-crema" />
            <div className="flex-1">
              <div className="h-6 w-14 rounded bg-crema" />
              <div className="mt-2 h-3 w-20 rounded bg-crema" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function SkeletonCard() {
  return (
    <div className="h-72 animate-pulse rounded-2xl border border-verde-oscuro/10 bg-white p-5 shadow-panel">
      <div className="h-4 w-32 rounded bg-crema" />
      <div className="mt-4 h-[calc(100%-2rem)] rounded-xl bg-crema/70" />
    </div>
  );
}
