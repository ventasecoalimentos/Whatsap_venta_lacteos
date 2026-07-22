const ESTILOS = {
  verde: 'bg-verde/15 text-verde',
  rojo: 'bg-rojo/15 text-rojo',
  dorado: 'bg-dorado/20 text-[#8a6a2a]',
  cafe: 'bg-cafe/15 text-cafe',
} as const;

export function Badge({ children, color }: { children: React.ReactNode; color: keyof typeof ESTILOS }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${ESTILOS[color]}`}>
      {children}
    </span>
  );
}
