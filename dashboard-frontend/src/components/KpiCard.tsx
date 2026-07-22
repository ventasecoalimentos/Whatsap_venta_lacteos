import type { LucideIcon } from 'lucide-react';

const ACENTOS = {
  verde: 'text-verde',
  rojo: 'text-rojo',
  dorado: 'text-[#8a6a2a]',
  cafe: 'text-cafe',
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
    <div className="rounded-[22px] bg-base p-5 shadow-neu transition-shadow duration-200 hover:shadow-neu-sm">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-base shadow-neu-sm ${ACENTOS[acento]}`}>
          <Icono className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <div className="font-display text-2xl font-bold leading-tight text-texto">{valor}</div>
          <div className="truncate text-xs text-texto-suave">{etiqueta}</div>
        </div>
      </div>
    </div>
  );
}
