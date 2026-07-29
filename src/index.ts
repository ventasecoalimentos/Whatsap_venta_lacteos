import { cargarEnv } from './config/env';
import { construirContenedor } from './config/contenedor';
import { crearApp } from './http/app';
import { ejecutarAvisoDemanda } from './application/avisoDemanda';

const env = cargarEnv();
const contenedor = construirContenedor(env);
const app = crearApp(
  contenedor.procesarMensajeEntrante,
  {
    clienteRepositorio: contenedor.clienteRepositorio,
    pedidoRepositorio: contenedor.pedidoRepositorio,
    servicioClienteRepositorio: contenedor.servicioClienteRepositorio,
  },
  { usuario: env.DASHBOARD_USUARIO, contrasena: env.DASHBOARD_CONTRASENA },
);

app.listen(env.PORT, () => {
  console.log(`[index] servidor escuchando en el puerto ${env.PORT}`);
});

// Tarea programada del aviso de "mucha demanda" (ver src/application/avisoDemanda.ts) — el umbral
// de silencio del cliente es el mismo VENTANA_INACTIVIDAD_HORAS que usa el reinicio del flujo
// (decisión del cliente: "todo a 30 min").
const umbralAvisoDemandaMs = env.VENTANA_INACTIVIDAD_HORAS * 60 * 60 * 1000;
setInterval(() => {
  ejecutarAvisoDemanda(contenedor.conversacionRepositorio, contenedor.proveedorMensajeria, umbralAvisoDemandaMs).catch(
    (error: unknown) => {
      console.error('[index] error ejecutando aviso de demanda:', error);
    },
  );
}, env.INTERVALO_AVISO_DEMANDA_MIN * 60 * 1000);
