import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Users,
  UserPlus,
  Package,
  ClipboardList,
  ShieldCheck,
  MapPin,
  TrendingUp,
  Milk,
} from 'lucide-react';
import { obtenerClientes, obtenerPedidos, obtenerQuejas } from './api';
import type { Cliente, Pedido, Queja } from './types';
import { KpiCard } from './components/KpiCard';
import { ChartCard } from './components/ChartCard';
import { DataTable, type Columna } from './components/DataTable';
import { Badge } from './components/Badge';
import { SkeletonKpis, SkeletonCard } from './components/Skeleton';

const VERDE = '#3e6b4d';
const CAFE = '#8a5a34';
const DORADO = '#c99b3f';
const AZUL = '#3a5a8a';
const ROJO = '#b5533f';

function formatearFecha(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function contarPor<T>(lista: T[], obtenerClave: (item: T) => string | null): Record<string, number> {
  const conteo: Record<string, number> = {};
  for (const item of lista) {
    const clave = obtenerClave(item) ?? 'Sin especificar';
    conteo[clave] = (conteo[clave] ?? 0) + 1;
  }
  return conteo;
}

export default function App() {
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [quejas, setQuejas] = useState<Queja[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actualizado, setActualizado] = useState<string>('');
  const [logoFallo, setLogoFallo] = useState(false);

  useEffect(() => {
    Promise.all([obtenerClientes(), obtenerPedidos(), obtenerQuejas()])
      .then(([c, p, q]) => {
        setClientes(c);
        setPedidos(p);
        setQuejas(q);
        setActualizado(new Date().toLocaleString('es-CO'));
      })
      .catch((err: unknown) => {
        console.error(err);
        setError('No se pudieron cargar los datos. Intenta recargar la página.');
      });
  }, []);

  const porCanal = useMemo(() => {
    if (!pedidos) return [];
    const conteo = contarPor(pedidos, (p) => (p.canal === 'detal' ? 'Detal' : 'Distribución'));
    return Object.entries(conteo).map(([name, value]) => ({ name, value }));
  }, [pedidos]);

  const porCiudad = useMemo(() => {
    if (!clientes) return [];
    const conteo = contarPor(clientes, (c) => c.ciudad);
    return Object.entries(conteo).map(([name, value]) => ({ name, value }));
  }, [clientes]);

  const porTipo = useMemo(() => {
    if (!quejas) return [];
    const conteo = contarPor(quejas, (q) => q.tipo);
    return Object.entries(conteo).map(([name, value]) => ({ name, value }));
  }, [quejas]);

  const tendencia = useMemo(() => {
    if (!clientes) return [];
    const dias: { clave: string; total: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const fecha = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      dias.push({ clave: fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }), total: 0 });
    }
    const porDia = new Map(dias.map((d) => [d.clave, d]));
    for (const c of clientes) {
      const clave = new Date(c.fechaRegistro).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
      const dia = porDia.get(clave);
      if (dia) dia.total += 1;
    }
    return dias;
  }, [clientes]);

  const clientesPorId = useMemo(() => {
    const mapa = new Map<string, Cliente>();
    for (const c of clientes ?? []) mapa.set(c.id, c);
    return mapa;
  }, [clientes]);

  const kpis = useMemo(() => {
    if (!clientes || !pedidos || !quejas) return null;
    const hace7dias = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const nuevos7dias = clientes.filter((c) => new Date(c.fechaRegistro).getTime() >= hace7dias).length;
    const autorizaron = clientes.filter((c) => c.aceptoTratamientoDatos).length;
    const porcentaje = clientes.length ? Math.round((autorizaron / clientes.length) * 100) : 0;
    return {
      totalClientes: clientes.length,
      nuevos7dias,
      totalPedidos: pedidos.length,
      totalQuejas: quejas.length,
      porcentajeAutorizo: clientes.length ? `${porcentaje}%` : '—',
    };
  }, [clientes, pedidos, quejas]);

  const columnasClientes: Columna<Cliente>[] = [
    { etiqueta: 'Nombre', valorOrden: (c) => c.nombre ?? '', render: (c) => c.nombre ?? <em className="text-neutral-400">Sin nombre</em> },
    { etiqueta: 'Teléfono', valorOrden: (c) => c.telefono, render: (c) => c.telefono },
    { etiqueta: 'Ciudad', valorOrden: (c) => c.ciudad ?? '', render: (c) => c.ciudad ?? '—' },
    {
      etiqueta: 'Datos autorizados',
      valorOrden: (c) => (c.aceptoTratamientoDatos ? 1 : 0),
      render: (c) => (c.aceptoTratamientoDatos ? <Badge color="verde">Sí</Badge> : <Badge color="rojo">No</Badge>),
    },
    { etiqueta: 'Registrado', valorOrden: (c) => c.fechaRegistro, render: (c) => formatearFecha(c.fechaRegistro) },
  ];

  const columnasPedidos: Columna<Pedido>[] = [
    {
      etiqueta: 'Cliente',
      valorOrden: (p) => clientesPorId.get(p.clienteId)?.nombre ?? '',
      render: (p) => clientesPorId.get(p.clienteId)?.nombre ?? <em className="text-neutral-400">Sin nombre</em>,
    },
    {
      etiqueta: 'Teléfono',
      valorOrden: (p) => clientesPorId.get(p.clienteId)?.telefono ?? '',
      render: (p) => clientesPorId.get(p.clienteId)?.telefono ?? '—',
    },
    {
      etiqueta: 'Canal',
      valorOrden: (p) => p.canal,
      render: (p) => (p.canal === 'detal' ? <Badge color="verde">Detal</Badge> : <Badge color="azul">Distribución</Badge>),
    },
    { etiqueta: 'Ciudad', valorOrden: (p) => p.ciudad ?? '', render: (p) => p.ciudad || '—' },
    { etiqueta: 'Fecha', valorOrden: (p) => p.creadoEn, render: (p) => formatearFecha(p.creadoEn) },
  ];

  const columnasQuejas: Columna<Queja>[] = [
    {
      etiqueta: 'Cliente',
      valorOrden: (q) => clientesPorId.get(q.clienteId)?.nombre ?? '',
      render: (q) => clientesPorId.get(q.clienteId)?.nombre ?? <em className="text-neutral-400">Sin nombre</em>,
    },
    {
      etiqueta: 'Identificación',
      valorOrden: (q) => clientesPorId.get(q.clienteId)?.identificacion ?? '',
      render: (q) => clientesPorId.get(q.clienteId)?.identificacion || '—',
    },
    {
      etiqueta: 'Correo',
      valorOrden: (q) => clientesPorId.get(q.clienteId)?.correo ?? '',
      render: (q) => clientesPorId.get(q.clienteId)?.correo || '—',
    },
    {
      etiqueta: 'Tipo',
      valorOrden: (q) => q.tipo,
      render: (q) => (q.tipo === 'PQR' ? <Badge color="rojo">PQR</Badge> : <Badge color="dorado">Sugerencia</Badge>),
    },
    { etiqueta: 'Descripción', valorOrden: (q) => q.descripcion ?? '', render: (q) => q.descripcion || '—', truncar: true },
    { etiqueta: 'Fecha', valorOrden: (q) => q.creadoEn, render: (q) => formatearFecha(q.creadoEn) },
  ];

  if (error) {
    return <p className="p-10 text-center text-neutral-500">{error}</p>;
  }

  return (
    <div className="min-h-screen bg-crema pb-16">
      <header className="relative overflow-hidden bg-gradient-to-br from-verde-oscuro via-verde to-verde-claro px-7 pb-16 pt-7 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, #fff 0, transparent 45%), radial-gradient(circle at 85% 60%, #fff 0, transparent 40%)',
          }}
        />
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-5">
          <span className="flex h-40 w-40 flex-shrink-0 items-center justify-center">
            {logoFallo ? (
              <Milk className="h-30 w-30 text-white drop-shadow" strokeWidth={1.5} />
            ) : (
              <img
                src="/dashboard/logo.png"
                alt="Llano Lácteos"
                className="h-full w-full object-contain drop-shadow-lg"
                onError={() => setLogoFallo(true)}
              />
            )}
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Llano Lácteos</h1>
            <p className="mt-1 text-sm text-white/80">Panel de Datos — Ventas y Servicio al cliente</p>
          </div>
          <div className="ml-auto text-right text-xs text-white/70">
            {actualizado && <>Actualizado: {actualizado}</>}
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-5">
        <section className="-mt-10 mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {kpis ? (
            <>
              <KpiCard Icono={Users} valor={kpis.totalClientes} etiqueta="Clientes registrados" />
              <KpiCard Icono={UserPlus} valor={kpis.nuevos7dias} etiqueta="Nuevos (últimos 7 días)" />
              <KpiCard Icono={Package} valor={kpis.totalPedidos} etiqueta="Pedidos registrados" />
              <KpiCard Icono={ClipboardList} valor={kpis.totalQuejas} etiqueta="PQRSF recibidos" />
              <KpiCard Icono={ShieldCheck} valor={kpis.porcentajeAutorizo} etiqueta="Autorizó tratamiento de datos" />
            </>
          ) : (
            <SkeletonKpis />
          )}
        </section>

        <section className="mb-8">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-verde-oscuro/60">
            Panorama general
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {!pedidos || !clientes || !quejas ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                <ChartCard titulo="Pedidos por canal" Icono={Package}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={porCanal} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                        {porCanal.map((_, i) => (
                          <Cell key={i} fill={[VERDE, AZUL][i % 2]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard titulo="Clientes por ciudad" Icono={MapPin}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={porCiudad}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7dfc9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill={CAFE} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard titulo="PQRSF por tipo" Icono={ClipboardList}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={porTipo} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                        {porTipo.map((_, i) => (
                          <Cell key={i} fill={[ROJO, DORADO][i % 2]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard titulo="Nuevos clientes (últimos 14 días)" Icono={TrendingUp}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tendencia}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7dfc9" />
                      <XAxis dataKey="clave" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="total" fill={VERDE} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-verde-oscuro/60">
            Detalle
          </h2>
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-verde-oscuro/10 bg-white p-5 shadow-panel">
              <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-verde-oscuro">
                <Users className="h-4 w-4" /> Clientes
              </h3>
              <DataTable columnas={columnasClientes} filas={clientes ?? []} buscarPlaceholder="Buscar cliente..." />
            </div>

            <div className="rounded-2xl border border-verde-oscuro/10 bg-white p-5 shadow-panel">
              <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-verde-oscuro">
                <Package className="h-4 w-4" /> Pedidos
              </h3>
              <DataTable columnas={columnasPedidos} filas={pedidos ?? []} buscarPlaceholder="Buscar pedido..." />
            </div>

            <div className="rounded-2xl border border-verde-oscuro/10 bg-white p-5 shadow-panel">
              <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-verde-oscuro">
                <ClipboardList className="h-4 w-4" /> PQRSF
              </h3>
              <DataTable columnas={columnasQuejas} filas={quejas ?? []} buscarPlaceholder="Buscar PQRSF..." />
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-10 text-center text-xs text-neutral-400">
        Llano Lácteos · Panel interno de uso exclusivo del equipo
      </footer>
    </div>
  );
}
