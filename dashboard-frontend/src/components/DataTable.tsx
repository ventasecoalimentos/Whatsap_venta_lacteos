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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={buscarPlaceholder}
          className="min-w-[220px] rounded-2xl bg-base px-4 py-2 text-sm text-texto shadow-neu-inset placeholder:text-texto-suave focus:outline-none"
        />
      </div>

      {filasFiltradas.length === 0 ? (
        <p className="py-6 text-center text-sm text-texto-suave">No hay datos todavía.</p>
      ) : (
        <div className="max-h-[380px] overflow-y-auto overflow-x-auto rounded-2xl bg-base shadow-neu-inset">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {columnas.map((col, i) => (
                  <th
                    key={col.etiqueta}
                    onClick={() => alternarOrden(i)}
                    className="sticky top-0 z-10 cursor-pointer select-none whitespace-nowrap bg-base-alt px-3 py-2.5 text-left font-semibold text-texto-suave hover:text-texto"
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
                <tr key={i} className="odd:bg-base even:bg-base-alt/50 hover:bg-base-alt">
                  {columnas.map((col) => (
                    <td
                      key={col.etiqueta}
                      className={`whitespace-nowrap px-3 py-2.5 text-texto ${
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
