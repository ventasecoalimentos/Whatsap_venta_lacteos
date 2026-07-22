import { useMemo, useState } from 'react';

export interface Columna<T> {
  etiqueta: string;
  valorOrden: (fila: T) => string | number;
  render: (fila: T) => React.ReactNode;
  truncar?: boolean;
}

export function DataTable<T>({
  columnas,
  filas,
  buscarPlaceholder,
}: {
  columnas: Columna<T>[];
  filas: T[];
  buscarPlaceholder: string;
}) {
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState<{ indice: number; asc: boolean } | null>(null);

  const filasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const base = !texto
      ? filas
      : filas.filter((fila) =>
          columnas.some((col) => String(col.valorOrden(fila)).toLowerCase().includes(texto)),
        );

    if (!orden) return base;
    const columna = columnas[orden.indice];
    return [...base].sort((a, b) => {
      const va = columna.valorOrden(a);
      const vb = columna.valorOrden(b);
      if (va < vb) return orden.asc ? -1 : 1;
      if (va > vb) return orden.asc ? 1 : -1;
      return 0;
    });
  }, [busqueda, orden, filas, columnas]);

  function alternarOrden(indice: number) {
    setOrden((actual) => {
      if (actual?.indice === indice) return { indice, asc: !actual.asc };
      return { indice, asc: true };
    });
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={buscarPlaceholder}
          className="min-w-[200px] rounded-lg border border-verde-oscuro/15 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-verde-claro"
        />
      </div>

      {filasFiltradas.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-500">No hay datos todavía.</p>
      ) : (
        <div className="max-h-[380px] overflow-y-auto overflow-x-auto rounded-lg border border-verde-oscuro/10">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {columnas.map((col, i) => (
                  <th
                    key={col.etiqueta}
                    onClick={() => alternarOrden(i)}
                    className="sticky top-0 z-10 cursor-pointer select-none whitespace-nowrap border-b border-verde-oscuro/10 bg-white px-3 py-2 text-left font-semibold text-neutral-500 hover:text-verde-oscuro"
                  >
                    {col.etiqueta}
                    <span className="ml-1 text-xs opacity-50">
                      {orden?.indice === i ? (orden.asc ? '▲' : '▼') : ''}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filasFiltradas.map((fila, i) => (
                <tr key={i} className="hover:bg-crema/60">
                  {columnas.map((col) => (
                    <td
                      key={col.etiqueta}
                      className={`whitespace-nowrap border-b border-verde-oscuro/10 px-3 py-2 ${
                        col.truncar ? 'max-w-[260px] overflow-hidden text-ellipsis' : ''
                      }`}
                    >
                      {col.render(fila)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
