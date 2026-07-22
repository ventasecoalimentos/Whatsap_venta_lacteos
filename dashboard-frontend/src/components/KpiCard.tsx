import type { LucideIcon } from 'lucide-react';

const ACENTOS = {
  verde: 'bg-verde-oscuro/10 text-verde-oscuro',
  rojo: 'bg-rojo/10 text-rojo',
  dorado: 'bg-dorado/15 text-[#8a6209]',
  cafe: 'bg-cafe/10 text-cafe',
} as const;

export function KpiCard({
  valor,
  etiqueta,
  Icono,
  acento = 'verde',
}: {
  valor: string | number;
  etiqueta: string;
  Icono: LucideIcon;
  acento?: keyof typeof ACENTOS;
}) {
  return (
    <div className="group rounded-2xl border border-verde-oscuro/10 bg-white p-5 shadow-panel transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${ACENTOS[acento]}`}
        >
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
