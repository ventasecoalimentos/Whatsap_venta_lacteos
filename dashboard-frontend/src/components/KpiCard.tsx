import type { LucideIcon } from 'lucide-react';

const ACENTOS = {
  verde: 'bg-verde/12 text-verde',
  rojo: 'bg-rojo/12 text-rojo',
  dorado: 'bg-dorado/15 text-[#8a6a2a]',
  cafe: 'bg-cafe/12 text-cafe',
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
    <div className="rounded-2xl bg-tarjeta p-5 shadow-card transition-shadow hover:shadow-card-sm">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${ACENTOS[acento]}`}>
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
