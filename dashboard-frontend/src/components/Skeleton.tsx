export function SkeletonKpis() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl bg-tarjeta p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 flex-shrink-0 rounded-xl bg-fondo" />
            <div className="flex-1">
              <div className="h-6 w-14 rounded bg-fondo" />
              <div className="mt-2 h-3 w-20 rounded bg-fondo" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function SkeletonCard() {
  return (
    <div className="h-72 animate-pulse rounded-2xl bg-tarjeta p-5 shadow-card">
      <div className="h-4 w-32 rounded bg-fondo" />
      <div className="mt-4 h-[calc(100%-2rem)] rounded-xl bg-fondo" />
    </div>
  );
}
