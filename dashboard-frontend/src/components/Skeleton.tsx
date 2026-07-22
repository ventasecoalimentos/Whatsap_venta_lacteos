export function SkeletonKpis() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-[22px] bg-base p-5 shadow-neu">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 flex-shrink-0 rounded-2xl bg-base-alt" />
            <div className="flex-1">
              <div className="h-6 w-14 rounded bg-base-alt" />
              <div className="mt-2 h-3 w-20 rounded bg-base-alt" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function SkeletonCard() {
  return (
    <div className="h-72 animate-pulse rounded-[22px] bg-base p-5 shadow-neu">
      <div className="h-4 w-32 rounded bg-base-alt" />
      <div className="mt-4 h-[calc(100%-2rem)] rounded-2xl bg-base-alt" />
    </div>
  );
}
