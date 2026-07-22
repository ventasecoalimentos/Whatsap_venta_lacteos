import type { LucideIcon } from 'lucide-react';

const BORDES = {
  verde: 'border-t-verde',
  rojo: 'border-t-rojo',
  dorado: 'border-t-dorado',
  cafe: 'border-t-cafe',
} as const;

export function ChartCard({
  titulo,
  Icono,
  acento = 'verde',
  children,
}: {
  titulo: string;
  Icono: LucideIcon;
  acento?: keyof typeof BORDES;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex h-72 flex-col rounded-2xl border-x border-b border-t-4 border-verde-oscuro/10 bg-white p-5 shadow-panel transition-shadow hover:shadow-lg ${BORDES[acento]}`}
    >
      <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-verde-oscuro">
        <Icono className="h-4 w-4" strokeWidth={2.25} /> {titulo}
      </h2>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
