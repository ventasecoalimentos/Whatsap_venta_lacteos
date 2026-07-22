import type { LucideIcon } from 'lucide-react';

const ACENTOS = {
  verde: 'text-verde',
  rojo: 'text-rojo',
  dorado: 'text-[#8a6a2a]',
  cafe: 'text-cafe',
} as const;

export function ChartCard({
  titulo,
  Icono,
  acento = 'verde',
  children,
}: {
  titulo: string;
  Icono: LucideIcon;
  acento?: keyof typeof ACENTOS;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-72 flex-col rounded-2xl bg-tarjeta p-5 shadow-card">
      <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-texto">
        <Icono className={`h-4 w-4 ${ACENTOS[acento]}`} strokeWidth={2.25} /> {titulo}
      </h2>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
