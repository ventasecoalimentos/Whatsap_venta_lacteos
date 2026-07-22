const ESTILOS = {
  verde: 'bg-verde-oscuro/10 text-verde-oscuro',
  rojo: 'bg-rojo/10 text-rojo',
  dorado: 'bg-dorado/15 text-[#8a6209]',
  cafe: 'bg-cafe/10 text-cafe',
} as const;

export function Badge({ children, color }: { children: React.ReactNode; color: keyof typeof ESTILOS }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILOS[color]}`}>
      {children}
    </span>
  );
}
