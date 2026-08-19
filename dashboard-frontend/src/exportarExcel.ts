import * as XLSX from 'xlsx';
import type { Cliente, Pedido, RegistroServicioCliente } from './types';

// Solo se usa para ESCRIBIR un archivo a partir de nuestros propios datos ya cargados en memoria
// (nunca XLSX.read/parse sobre un archivo ajeno) — las vulnerabilidades conocidas de la librería
// `xlsx` están todas en el parseo de archivos no confiables, que este módulo nunca ejercita.

const ETIQUETA_CANAL: Record<Pedido['canal'], string> = {
  detal: 'Detal',
  distribucion: 'Distribución',
  negocio: 'Negocio',
};

function formatearFechaExcel(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// El cliente tiene teléfono O bsuid (escribió con username de WhatsApp sin compartir su número,
// ver docs/INTEGRACION_YCLOUD.md) — nunca ambos, nunca ninguno.
function identificadorExcel(cliente: Pick<Cliente, 'telefono' | 'bsuid'> | undefined): string {
  if (!cliente) return '';
  return cliente.telefono ?? cliente.bsuid ?? '';
}

export function exportarDatosAExcel(datos: {
  clientes: Cliente[];
  pedidos: Pedido[];
  registrosPqrsf: RegistroServicioCliente[];
  registrosFacturacion: RegistroServicioCliente[];
}): void {
  const clientesPorId = new Map(datos.clientes.map((c) => [c.id, c]));

  const libro = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    libro,
    XLSX.utils.json_to_sheet(
      datos.clientes.map((c) => ({
        Nombre: c.nombre ?? '',
        Teléfono: identificadorExcel(c),
        Ciudad: c.ciudad ?? '',
        'Datos autorizados': c.aceptoTratamientoDatos ? 'Sí' : 'No',
        Registrado: formatearFechaExcel(c.fechaRegistro),
      })),
    ),
    'Clientes',
  );

  XLSX.utils.book_append_sheet(
    libro,
    XLSX.utils.json_to_sheet(
      datos.pedidos.map((p) => ({
        Cliente: clientesPorId.get(p.clienteId)?.nombre ?? '',
        Teléfono: identificadorExcel(clientesPorId.get(p.clienteId)),
        Canal: ETIQUETA_CANAL[p.canal],
        Fecha: formatearFechaExcel(p.creadoEn),
      })),
    ),
    'Pedidos',
  );

  XLSX.utils.book_append_sheet(
    libro,
    XLSX.utils.json_to_sheet(
      datos.registrosPqrsf.map((r) => ({
        Cliente: clientesPorId.get(r.clienteId)?.nombre ?? '',
        Identificación: clientesPorId.get(r.clienteId)?.identificacion ?? '',
        Correo: clientesPorId.get(r.clienteId)?.correo ?? '',
        Tipo: r.tipo,
        Descripción: r.descripcion ?? '',
        Fecha: formatearFechaExcel(r.creadoEn),
      })),
    ),
    'PQRSF',
  );

  XLSX.utils.book_append_sheet(
    libro,
    XLSX.utils.json_to_sheet(
      datos.registrosFacturacion.map((f) => ({
        Cliente: clientesPorId.get(f.clienteId)?.nombre ?? '',
        Identificación: clientesPorId.get(f.clienteId)?.identificacion ?? '',
        Correo: clientesPorId.get(f.clienteId)?.correo ?? '',
        Teléfono: identificadorExcel(clientesPorId.get(f.clienteId)),
        Fecha: formatearFechaExcel(f.creadoEn),
      })),
    ),
    'Facturación',
  );

  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(libro, `llano-lacteos-datos-${fecha}.xlsx`);
}
