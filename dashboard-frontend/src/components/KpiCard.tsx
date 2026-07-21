import type { LucideIcon } from 'lucide-react';

export function KpiCard({
  valor,
  etiqueta,
  Icono,
}: {
  valor: string | number;
  etiqueta: string;
  Icono: LucideIcon;
}) {
  return (
    <div className="group rounded-2xl border border-verde-oscuro/10 bg-white p-5 shadow-panel transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-crema text-verde-oscuro transition-colors group-hover:bg-verde-oscuro/10">
          <Icono className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <div className="font-display text-2xl font-bold leading-tight text-verde-oscuro">{valor}</div>
          <div className="truncate text-xs text-neutral-500">{etiqueta}</div>
        </div>
      </div>
    </div>
  );
}
